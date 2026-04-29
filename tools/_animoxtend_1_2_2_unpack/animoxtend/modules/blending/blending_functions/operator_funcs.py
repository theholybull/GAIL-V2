import datetime
import logging
import time

import bpy
import numpy as np

from .client.blending_client import request_blending, request_inbetween
from .post_processing.blender_free_post_process import MotionPostProcesser
from .post_processing.blender_post_process import blender_auto_post_process
from .utils.blend_bone_mapping import blend_bone_mapping, blend_check_bone_mapping
from .utils.blender_utils import (
    add_qt_armature,
    check_armature_vaild,
    convert_action_to_nla_track,
    delete_object_completely,
    get_keyframe_points_from_strips,
    get_scale,
    get_selected_keyframes,
    get_selected_nla_strips,
    get_unique_name,
    # trim_action_frames,
    merge_strips_and_bake,
    select_target_keyframes,
    switch_mode,
)
from .utils.extract_skeleton_info import extract_skeleton_info_pose_mode
from .utils.fast_blending_utils import align_src_motion_to_tgt_restpose, linear_interp, restore_hands, restore_hands_v1
from .utils.file_utils import concat_npz_dict
from .utils.npz_apply import load_npz
from .utils.npz_export import export_npz_dict_from_armature, find_root_bone_name

logger = logging.getLogger("animoxtend")
KEYFRAMES_BACKUP = {}


""" Funcs For Panel Operatoers """


def motion_blend_reset(self: bpy.types.Operator, context: bpy.types.Context):
    armature = getattr(context.scene, 'armature1')
    reset_keyframes(armature)

    self.report({'INFO'}, f"Armature {armature.name} reset successfully")


class MotionBlend:
    def __init__(self, operator: bpy.types.Operator, context: bpy.types.Context):
        self.operator: bpy.types.Operator = operator
        self.context: bpy.types.Context = context
        self.scene = context.scene
        self.armature1: bpy.types.Object = self.scene.armature1
        self.armature2: bpy.types.Object = self.scene.armature2

        self.scene_blend_setting = self.scene.blending_settings
        self.blend_mode = self.scene.blend_mode
        self.storaged_mode = self.blend_mode

        self.origin_frame = self.scene.frame_current
        self.origin_keep_target_place = self.scene.keep_target_place
        self.origin_expand_advanced_ui = self.scene.expand_advanced_ui

        self.qt_armature = None
        self.armature1_mode = self.armature1.mode if self.armature1 else None
        self.armature2_mode = self.armature2.mode if self.armature2 else None

    def reset_context(self):
        """Reset scene context."""
        if self.blend_mode == 'NEURAL' and self.qt_armature:
            delete_object_completely(self.qt_armature)
            self.scene.keep_target_place = self.origin_keep_target_place
            self.scene.expand_advanced_ui = self.origin_expand_advanced_ui

        bpy.ops.object.select_all(action='DESELECT')
        self.armature1.select_set(True)
        bpy.context.view_layer.objects.active = self.armature1
        bpy.context.scene.frame_set(self.origin_frame)

        self.scene.blend_mode = self.storaged_mode

        switch_mode(self.armature1, self.armature1_mode)
        switch_mode(self.armature2, self.armature2_mode)

    def validate_armatures(self):
        """Check if armatures are valid."""
        if not self.armature1 or not self.armature2:
            self.operator.report({'ERROR'}, "Please select two armatures.")
            return False
        if not (
            check_armature_vaild(self.operator, self.context, self.armature1)
            and check_armature_vaild(self.operator, self.context, self.armature2)
        ):
            return False
        return True

    def validate_bone_mapping(self):
        for i in range(2):
            if i == 0:
                armature = self.armature1
            else:
                armature = self.armature2

            bone_mapping_dict = blend_bone_mapping(armature)
            root_vaild, _ = blend_check_bone_mapping(bone_mapping_dict)
            if not root_vaild:
                self.operator.report(
                    {'ERROR'},
                    f"Retargeting for {armature.name} failed, "
                    f"please first retarget {armature.name} to BufferArmature on the panel manually, "
                    "then perform smart concat.",
                )

                template_collection = bpy.data.collections.get("Template")

                template_collection.hide_viewport = False
                template_collection.hide_render = False

                return False

        return True

    def prepare_armatures(self):
        """Ensure armatures are in OBJECT mode."""
        if self.armature1_mode != 'OBJECT':
            switch_mode(self.armature1, 'OBJECT')
        if self.armature2_mode != 'OBJECT':
            switch_mode(self.armature2, 'OBJECT')

    def __call__(self):
        ## 1. check armature
        vaild_flag = self.validate_armatures()
        if not vaild_flag:
            return {'CANCELLED'}
        if not self.validate_bone_mapping():
            return {'CANCELLED'}

        ## 2. prepare armature
        self.prepare_armatures()

        try:
            ## 3. prepare data
            motion_dict1 = export_npz_dict_from_armature(self.armature1.name)
            armature1_frame_start = self.armature1.animation_data.action.frame_range[0]

            copy_keyframes(self.armature1)

            # if Neural mode with trans len == 0, use fast mode
            if self.blend_mode == 'NEURAL' and self.scene_blend_setting.trans_len == 0:
                self.blend_mode = 'FAST'

            if self.blend_mode == 'NEURAL':
                qt_armature_name = add_qt_armature()
                self.qt_armature = bpy.data.objects[qt_armature_name]

                self.scene.keep_target_place = False
                self.scene.expand_advanced_ui = True

                dict1_qt = retarget_src2tgt(
                    src_armature=self.armature1,
                    tgt_armature=self.qt_armature,
                    ret_npz=True,
                    tgt_skeleton_key='qingtong',
                )

                dict2_qt = retarget_src2tgt(
                    src_armature=self.armature2,
                    tgt_armature=self.qt_armature,
                    ret_npz=True,
                    tgt_skeleton_key='qingtong',
                )

                # scale next motion to fix shift problem due to retargeting
                a_start = motion_dict1['transl'][0]
                b_start = dict2_qt['transl'][0]

                scale = get_scale(self.armature1, self.qt_armature)

                b_new_start = a_start + (b_start - a_start) * scale
                delta = b_new_start - b_start

                b_transl = np.array(dict2_qt['transl'])
                b_transl += delta

                dict2_qt['transl'] = b_transl

                npz_dict_list = [dict1_qt, dict2_qt]
                logger.info("------------ Retargeting done! ----------------")
            else:
                if not check_armatures_topology_and_rest_pose(self.armature1, self.armature2):
                    self.operator.report(
                        {'ERROR'}, "Fast blend mode requires armatures have same topology and rest pose."
                    )
                    raise Exception("Armatures do not have identical topology or rest pose.")

                motion_dict2 = export_npz_dict_from_armature(self.armature2.name)
                armature1_rest_pose = extract_skeleton_info_pose_mode(self.armature1)
                armature2_rest_pose = extract_skeleton_info_pose_mode(self.armature2)
                motion_dict2 = align_src_motion_to_tgt_restpose(motion_dict2, armature2_rest_pose, armature1_rest_pose)

                # 长度过短，不满足fast blend最短帧数需求
                if motion_dict1['len'] < 10 or motion_dict2['len'] < 10:
                    if motion_dict1['len'] < 2 or motion_dict2['len'] < 2:
                        result_npz_dict = concat_npz_dict([motion_dict1, motion_dict2])
                    else:
                        result_npz_dict = linear_interp(motion_dict1, motion_dict2)
                    load_npz(result_npz_dict, self.armature1, frame_base=armature1_frame_start)

                    self.reset_context()
                    self.scene.blend_mode = self.storaged_mode

                    self.operator.report({'INFO'}, "Armatures smart concat successfully!")
                    return {'FINISHED'}

                npz_dict_list = [motion_dict1, motion_dict2]
                self.qt_armature = None

            # 4. requset blends
            blending_tik = time.time()
            blend_setting = {
                "trans_len": self.scene_blend_setting.trans_len,
                "pre_context_len": self.scene_blend_setting.pre_context_len,
                "pre_mask_len": self.scene_blend_setting.pre_mask_len,
                "next_context_len": self.scene_blend_setting.next_context_len,
                "next_mask_len": self.scene_blend_setting.next_mask_len,
            }

            key_words_list = [
                self.scene_blend_setting.pre_text if self.scene_blend_setting.use_state_machine else None,
                self.scene_blend_setting.next_text if self.scene_blend_setting.use_state_machine else None,
            ]

            ret_npz_dict_list = request_blending(
                task_id='add_on_test',
                npz_dict_list=npz_dict_list,
                blend_setting=blend_setting,
                key_words_list=key_words_list,
                blend_mode=self.blend_mode,
                use_state_machine=self.scene_blend_setting.use_state_machine,
            )

            result_npz_dict = concat_npz_dict(npz_dict_list=ret_npz_dict_list)
            if self.blend_mode == 'NEURAL':
                result_npz_dict = restore_hands(npz_dict_list, result_npz_dict, self.qt_armature, blend_setting)

            logger.debug("Blending used time: %.4fs", time.time() - blending_tik)
            logger.info("------------ Request blending done! -----------")

            # 5. post process motion
            process_motion(
                src_motion_dict=result_npz_dict,
                src_armature=self.qt_armature,
                tgt_armature=self.armature1,
                blend_mode=self.blend_mode,
                blender_free=self.scene_blend_setting.post_processing_mode == 'FASTER',
                post_process_flag=self.scene_blend_setting.post_processing,
                frame_start=armature1_frame_start,
            )

            self.reset_context()
            self.operator.report({'INFO'}, "Armature blending completed successfully!")

        except Exception as e:
            logger.error(f"error: {e}")
            self.reset_context()
            return {'CANCELLED'}


def motion_inbetween_reset(self: bpy.types.Operator, context: bpy.types.Context):
    armature = getattr(context.scene, 'armature_inbetween')

    if context.scene.inbetween_pre_mode == 'KFRAMES':
        reset_keyframes(armature)
        return {'FINISHED'}

    if context.scene.inbetween_pre_mode == 'NLA':
        reset_nla(armature, context.scene.nla_new_track_name)

    self.report({'INFO'}, "Armature reset successfully!")


class MotionInbetween:
    def __init__(self, operator: bpy.types.Operator, context: bpy.types.Context):
        self.operator: bpy.types.Operator = operator
        self.context: bpy.types.Context = context

        self.scene = self.context.scene
        self.origin_frame = self.scene.frame_current

        self.origin_frame = self.scene.frame_current
        self.origin_keep_target_place = self.scene.keep_target_place
        self.origin_expand_advanced_ui = self.scene.expand_advanced_ui

        self.qt_armature = None
        self.armature: bpy.types.Object = getattr(self.scene, 'armature_inbetween')
        self.armature_mode = self.armature.mode if self.armature else None

    def mode_check(self):
        k_frames = has_selected_keyframes(self.armature)
        strips = has_selected_nla_strips(self.armature)

        if k_frames:
            return 'K_FRAMES'

        if strips:
            return 'NLA'

        return 'NONE'

    def reset_context(self):
        """Reset scene context."""
        if self.qt_armature:
            delete_object_completely(self.qt_armature)
            self.scene.keep_target_place = self.origin_keep_target_place
            self.scene.expand_advanced_ui = self.origin_expand_advanced_ui

        bpy.ops.object.select_all(action='DESELECT')
        self.armature.select_set(True)
        bpy.context.view_layer.objects.active = self.armature
        bpy.context.scene.frame_set(self.origin_frame)

        switch_mode(self.armature, self.armature_mode)

    def validate_armature(self, check_animation=True):
        """Validate the armature and ensure it is properly selected."""
        cur_active_armature = bpy.context.object
        if cur_active_armature != self.armature:
            self.operator.report(
                {'ERROR'},
                "The current active armature and inbetween armature are different. "
                "Please specify the inbetween armature correctly!",
            )
            return False

        if not check_armature_vaild(self.operator, self.context, self.armature, check_animation):
            return False

        return True

    def validate_bone_mapping(self):
        bone_mapping_dict = blend_bone_mapping(self.armature)
        root_vaild, _ = blend_check_bone_mapping(bone_mapping_dict)
        if not root_vaild:
            self.operator.report(
                {'ERROR'},
                f"Retargeting for {self.armature.name} failed, "
                f"please first retarget {self.armature.name} to BufferArmature on the panel manually, "
                "then perform smart concat.",
            )

            template_collection = bpy.data.collections.get("Template")

            template_collection.hide_viewport = False
            template_collection.hide_render = False

            return False

        return True

    def prepare_armature(self):
        """Ensure armatures are in OBJECT mode."""
        if self.armature_mode != 'OBJECT':
            switch_mode(self.armature, 'OBJECT')

    def pre_retargeting(self):
        """Retargeting before motion inbetween.

        Returns:
            dict: motion dict in qt skeleton.
        """
        qt_armature_name = add_qt_armature()
        self.qt_armature = bpy.data.objects[qt_armature_name]

        self.scene.keep_target_place = False
        self.scene.expand_advanced_ui = True
        switch_mode(self.armature, 'OBJECT')

        dict_qt = retarget_src2tgt(
            src_armature=self.armature,
            tgt_armature=self.qt_armature,
            ret_npz=True,
            tgt_skeleton_key='qingtong',
        )
        logger.info("------------ Retargeting done! ----------------")

        return dict_qt

    def process_motion(self, src_motion_dict, frame_start, inbetween_setting=None):
        """Process afetr motion inbetween

        Args:
            src_motion_dict (_type_): motion dict in qt skeleton
            frame_start (_type_): start frame of src motion dict
            inbetween_setting (_type_, optional): _description_. Defaults to None.
        """
        if inbetween_setting is None:
            inbetween_setting = self.scene.inbetween_settings

        blender_free = inbetween_setting.post_processing_mode == 'FASTER'
        post_process_flag = inbetween_setting.post_processing
        process_motion(
            src_motion_dict=src_motion_dict,
            src_armature=self.qt_armature,
            tgt_armature=self.armature,
            blend_mode='NEURAL',
            blender_free=blender_free,
            post_process_flag=post_process_flag,
            frame_start=frame_start,
        )

    def kframe_mode(self):
        try:
            ## 1. check and prepare armaturte
            if not self.validate_armature():
                return {'CANCELLED'}
            if not self.validate_bone_mapping():
                return {'CANCELLED'}

            self.prepare_armature()

            copy_keyframes(self.armature)

            ## 2. extract keyframes
            frame_range = self.armature.animation_data.action.frame_range
            armature_frame_start = int(frame_range[0])

            inbetween_setting = self.scene.inbetween_settings

            if True:
                selected_kframes = get_selected_keyframes(self.armature)
                selected_kframes_list = list(selected_kframes)

                if selected_kframes is None or len(selected_kframes) == 0:
                    self.operator.report({'INFO'}, "Please select at least one keyframe!")
                    raise Exception("Please select at least one keyframe!")

                pre_end_idx, target_idx, cond_idxs = find_discontinuities_simple(selected_kframes)
                if pre_end_idx is None:
                    self.operator.report({'INFO'}, "Continuous frames selected, no processing!")
                    raise Exception("Continuous frames selected, no processing!")

                logger.debug(f"pre_end_idx: {pre_end_idx}, cond_idxs: {cond_idxs}, target_idx: {target_idx}")

                inbetween_setting.start_idx = selected_kframes_list[0]
                inbetween_setting.end_idx = selected_kframes_list[-1]

                inbetween_setting.cond_frames_idx.clear()
                for idx in cond_idxs:
                    inbetween_setting.add_cond_frame(idx)

            ## 3. retargeting
            dict_qt = self.pre_retargeting()

            # 4. blending
            blending_tik = time.time()

            cond_frames_idx = [
                [item.value - armature_frame_start, item.value + 1 - armature_frame_start]
                for item in inbetween_setting.cond_frames_idx
            ]
            cond_frames_idx = sorted(cond_frames_idx, key=lambda x: x[0])

            seq_slice = [
                pre_end_idx - armature_frame_start,
                target_idx - armature_frame_start,
            ]

            ret_qt_dict = request_inbetween(
                motion_dict=dict_qt,
                cond_frames_idx=cond_frames_idx,
                seq_slice=seq_slice,
            )
            ret_qt_dict = restore_hands_v1(dict_qt, ret_qt_dict, self.qt_armature, seq_slice)
            logger.debug("Inbetween used time: %.4fs", time.time() - blending_tik)
            logger.info("------------ Request Inbetween done! ----------")

            # 4. post processing
            self.process_motion(
                src_motion_dict=ret_qt_dict, frame_start=armature_frame_start, inbetween_setting=inbetween_setting
            )

            ## 5. restore unselected keyframes
            exclude_slice = (inbetween_setting.start_idx, inbetween_setting.end_idx)
            reset_keyframes(self.armature, delete_all=False, exclude_slice=exclude_slice)

            ## 6. reset context
            self.reset_context()
            select_target_keyframes(self.armature, selected_kframes)

            self.scene.inbetween_pre_mode = "KFRAMES"
            self.operator.report({'INFO'}, "Key Frames Motion Inbetween Successfully!")

        except Exception as e:
            logger.error(f"error: {e}")
            self.reset_context()
            return {'CANCELLED'}

    def nla_mode(self):
        try:
            ## 1. check and prepare armaturte
            if not self.validate_armature(check_animation=False):
                return {'CANCELLED'}
            if not self.validate_bone_mapping():
                return {'CANCELLED'}

            self.prepare_armature()

            ## 2. extract nla strips
            selected_strips = get_selected_nla_strips(self.armature)
            if not selected_strips or len(selected_strips) < 2:
                self.operator.report({'INFO'}, f"Please select at least two nla strips on {self.armature.name}!")
                return {'CANCELLED'}

            strips_info = get_strips_start_end(self.armature, selected_strips)
            flag = check_no_overlap(strips_info)
            if not flag:
                self.overlap_nla_mode(strips_info)

                # self.operator.report({'ERROR'}, "Please select no overlap nla strips!")
                return {'CANCELLED'}

            # No overlap nla
            ## 3. prepare strips and bake action
            pre_strip_obj = strips_info[0][0]
            next_strip_obj = strips_info[-1][0]

            pre_start, pre_end = pre_strip_obj.frame_start, pre_strip_obj.frame_end
            next_start, next_end = next_strip_obj.frame_start, next_strip_obj.frame_end
            strips_names = [strip_info[0].name for strip_info in strips_info]

            cur_mode = self.armature.mode
            if cur_mode != 'OBJECT':
                switch_mode(self.armature, 'OBJECT')
            self.armature.select_set(True)
            bpy.context.view_layer.objects.active = self.armature

            merge_strips_and_bake(
                self.armature,
                strips_names,
                start_frame=pre_start,
                end_frame=next_end,
            )

            ## 4. retargeting
            dict_qt = self.pre_retargeting()

            ## 5. blending
            frame_range = self.armature.animation_data.action.frame_range
            frame_start = int(frame_range[0])

            blending_tik = time.time()
            context_len = pre_end - frame_start
            target_idx = next_start - frame_start

            if len(strips_info) > 2:
                cond_start = strips_info[1][1]
                cond_strips_names = [strip_info[0].name for strip_info in strips_info[1:-1]]

                cond_ori_idxs = get_keyframe_points_from_strips(self.armature, cond_strips_names)
                bias = cond_ori_idxs[0] - cond_start

                cond_frames_idx = [int(idx - bias - pre_start) for idx in cond_ori_idxs]

                cond_frames_idx = [[idx, idx + 1] for idx in cond_frames_idx]
                cond_frames_idx = sorted(cond_frames_idx, key=lambda x: x[0])
            else:
                cond_frames_idx = []

            seq_slice = [int(context_len), int(target_idx)]

            ret_qt_dict = request_inbetween(
                motion_dict=dict_qt,
                cond_frames_idx=cond_frames_idx,
                seq_slice=seq_slice,
            )
            ret_qt_dict = restore_hands_v1(dict_qt, ret_qt_dict, self.qt_armature, seq_slice)
            logger.debug("Inbetween used time: %.4fs", time.time() - blending_tik)
            logger.info("------------ Request Inbetween done! ----------")

            ## 6. post processing
            self.process_motion(src_motion_dict=ret_qt_dict, frame_start=pre_start)

            # trim_action_frames(
            #     armature=armature,
            #     start_frame=pre_end,
            #     end_frame=next_start,
            # )

            ## 7. push down
            new_track_name = convert_action_to_nla_track(self.armature)

            ## 8. reset context
            self.reset_context()

            self.scene.inbetween_pre_mode = "NLA"
            self.scene.nla_new_track_name = new_track_name

            self.operator.report({'INFO'}, "NLA Motion Inbetween Successfully!")

        except Exception as e:
            logger.error(f"error: {e}")
            self.reset_context()
            return {'CANCELLED'}

    def overlap_nla_mode(self, strips_info):
        # Overlap nla, currently only support two overlap strips
        if len(strips_info) != 2:
            self.operator.report({'ERROR'}, "When strips overlap, only two strips can be selected!")
            return

        flag = check_overlap_vaild(strips_info)
        if flag == "Full Inclusion":
            self.operator.report({'ERROR'}, "Inbetween does not support the current overlap mode!")
            return
        if flag == "Adjacent":
            self.operator.report({'INFO'}, "Strips have no overlap and no gap, no operation is performed!")
            return

        ## 1. backup strips and tracks
        backup_strips_info = []
        backup_track_info = []

        for track in self.armature.animation_data.nla_tracks:
            track_flag = False

            for strip in track.strips:
                backup_strips_info.append(
                    {
                        "name": strip.name,
                        "mute": strip.mute,
                        "extrapolation": strip.extrapolation,
                        'blending': strip.blend_type,
                        'influence': strip.influence,
                    }
                )

                if strip.select:  # 检查 NLA Strip 是否被选中
                    strip.mute = False
                    strip.extrapolation = 'NOTHING'
                    strip.blend_type = 'REPLACE'
                    strip.influence = 1.0

                    track_flag = True
                else:
                    strip.mute = True

            backup_track_info.append(
                {"name": track.name, "mute": track.mute, "is_solo": track.is_solo, "lock": track.lock}
            )

            if track_flag:
                track.mute = False
                track.is_solo = False
                track.lock = False
            else:
                track.mute = True
                track.is_solo = False

        ## 2. bake action
        pre_strip_obj = strips_info[0][0]
        next_strip_obj = strips_info[-1][0]

        pre_start, pre_end = pre_strip_obj.frame_start, pre_strip_obj.frame_end
        next_start, next_end = next_strip_obj.frame_start, next_strip_obj.frame_end

        # create new action to bake
        existing_action_names = {action.name for action in bpy.data.actions}
        unique_action_name = get_unique_name(existing_action_names, base_name="Baked_Merged_Action")

        baked_action = bpy.data.actions.new(name=unique_action_name)
        self.armature.animation_data.action = baked_action

        bpy.ops.object.mode_set(mode="OBJECT")
        bpy.ops.object.mode_set(mode="POSE")
        bpy.ops.pose.select_all(action='SELECT')

        bpy.ops.nla.bake(
            frame_start=int(pre_start),
            frame_end=int(next_end),
            step=1,
            visual_keying=True,
            clear_constraints=True,
            use_current_action=True,  # 将烘焙结果写入当前动作
            bake_types={"POSE"},
        )

        ## 3. retargeting
        dict_qt = self.pre_retargeting()

        ## 4. blending
        frame_range = self.armature.animation_data.action.frame_range
        frame_start = int(frame_range[0])

        blending_tik = time.time()

        ## ------------------------------------------------
        ## ---- 1.start-------------------1.end------------
        ## -----------------2.start---------------2.end----
        context_len = next_start - frame_start
        target_idx = pre_end + 1 - frame_start
        cond_frames_idx = []

        seq_slice = [int(context_len), int(target_idx)]
        ret_qt_dict = request_inbetween(
            motion_dict=dict_qt,
            cond_frames_idx=cond_frames_idx,
            seq_slice=seq_slice,
        )
        ret_qt_dict = restore_hands_v1(dict_qt, ret_qt_dict, self.qt_armature, seq_slice)
        logger.debug("Inbetween used time: %.4fs", time.time() - blending_tik)
        logger.info("------------ Request Inbetween done! ----------")

        ## 6. post processing
        self.process_motion(src_motion_dict=ret_qt_dict, frame_start=pre_start)

        # trim_action_frames(
        #     armature=armature,
        #     start_frame=pre_end,
        #     end_frame=next_start,
        # )

        ## 7. push down
        new_track_name = convert_action_to_nla_track(self.armature)

        ## 8. restore tracks && strips
        strip_backup_map = {strip["name"]: strip for strip in backup_strips_info}
        track_backup_map = {track["name"]: track for track in backup_track_info}

        for track in self.armature.animation_data.nla_tracks:
            track_backup = track_backup_map.get(track.name)
            if track_backup:
                track.mute = track_backup["mute"]
                track.lock = track_backup["lock"]
                track.is_solo = track_backup["is_solo"]

            for strip in track.strips:
                strip_backup = strip_backup_map.get(strip.name)
                if strip_backup:
                    strip.mute = strip_backup["mute"]
                    strip.extrapolation = strip_backup["extrapolation"]
                    strip.blend_type = strip_backup["blending"]
                    strip.influence = strip_backup["influence"]

        ## 8. reset context
        self.reset_context()

        self.scene.inbetween_pre_mode = "NLA"
        self.scene.nla_new_track_name = new_track_name

        self.operator.report({'INFO'}, "NLA Motion Inbetween Successfully!")

    def __call__(self) -> None:
        if not check_armature_vaild(self.operator, self.context, self.armature, check_animation=False):
            return

        mode = self.mode_check()

        if mode == 'K_FRAMES':
            self.kframe_mode()
        elif mode == 'NLA':
            self.nla_mode()
        else:
            self.operator.report({'ERROR'}, "Please select keyframes or NLA strips!")
        return {'FINISHED'}


SELECTED_STATUS = {
    "k_frames_selected": False,
    "nla_strips_selected": False,
}


def has_selected_keyframes(armature):
    """
    检测是否有关键帧被选中。

    参数:
        armature (bpy.types.Object): 需要检查的骨架对象。

    返回:
        bool: 如果有至少一个关键帧被选中，返回 True; 否则返回 False。
    """
    # 确保对象有动画数据
    if not armature or not armature.animation_data or not armature.animation_data.action:
        return False

    action = armature.animation_data.action

    # 遍历 F-Curves 查找选中的关键帧
    for fcurve in action.fcurves:
        for keyframe in fcurve.keyframe_points:
            if keyframe.select_control_point:  # 检查关键帧是否被选中
                return True  # 一旦找到选中的关键帧，立即返回 True

    return False  # 遍历结束后未找到选中的关键帧，返回 False


def has_selected_nla_strips(armature):
    """
    检测是否存在选中的 NLA Strips。

    :param armature: Blender 对象，通常为 Armature
    :return: 如果有至少一个选中的 NLA Strip, 返回 True; 否则返回 False
    """
    if not armature or not armature.animation_data or not armature.animation_data.nla_tracks:
        return False

    # 遍历所有 NLA 轨道
    for track in armature.animation_data.nla_tracks:
        for strip in track.strips:
            if strip.select:  # 检查 NLA Strip 是否被选中
                return True  # 一旦找到选中的 Strip，立即返回 True

    return False  # 如果遍历完没有发现选中的 Strip，返回 False


def update_selected_status(scene):
    armature = getattr(scene, 'armature_inbetween', None)
    if not armature:
        SELECTED_STATUS["k_frames_selected"] = False
        SELECTED_STATUS["nla_strips_selected"] = False
        return

    SELECTED_STATUS["k_frames_selected"] = has_selected_keyframes(armature)
    SELECTED_STATUS["nla_strips_selected"] = has_selected_nla_strips(armature)


""" helper funcs for operator """


def retarget_src2tgt(src_armature, tgt_armature, ret_npz=False, tgt_skeleton_key="qingtong"):
    """Call quick retargeting operator"""
    bpy.ops.object.select_all(action='DESELECT')
    src_armature.select_set(True)
    bpy.context.view_layer.objects.active = src_armature
    bpy.ops.animoxtend.copy_motion()
    src_armature.select_set(False)
    bpy.context.view_layer.objects.active = None

    bpy.ops.object.select_all(action='DESELECT')
    tgt_armature.select_set(True)
    bpy.context.view_layer.objects.active = tgt_armature
    bpy.ops.animoxtend.paste_motion()

    if ret_npz:
        tgt_npz = export_npz_dict_from_armature(
            tgt_armature.name,
            skeleton_key=tgt_skeleton_key,
        )
        return tgt_npz


def process_motion(
    src_motion_dict: dict,
    src_armature: bpy.types.Object,
    tgt_armature: bpy.types.Object,
    blend_mode: str,
    blender_free: bool,
    post_process_flag: bool,
    frame_start: int = None,
) -> None:
    """
    post processing for motion dict, i.e. rm foot sliding && fix jiter

    Args:
        src_motion_dict: dict -> all in qt mode
        src_armature: bpy.types.Object
        tgt_armature: bpy.types.Object
        blend_mode: str
        blender_free: bool
        post_process_flag: bool
        frame_start: int
    """
    frame_start = 1 if frame_start is None else frame_start

    if blend_mode == 'FAST':
        # 无需后处理，直接load
        load_npz(src_motion_dict, tgt_armature, frame_base=frame_start)
    elif not post_process_flag:
        load_npz(src_motion_dict, src_armature, frame_base=frame_start)
        retarget_src2tgt(src_armature, tgt_armature, ret_npz=False)
    else:
        if blender_free:
            # blender free的，先在qt上修复，然后再重定向
            src_fixed_motion_dict = blender_free_post_process(src_motion_dict)
            load_npz(src_fixed_motion_dict, src_armature, frame_base=frame_start)
            retarget_src2tgt(src_armature, tgt_armature, ret_npz=False)

        else:
            # Blender的：先在qt上检测滑步，再重定向，最后在user armature上修复
            tgt_fix_dict = blender_post_process(src_motion_dict, src_armature, tgt_armature, frame_start=frame_start)

            load_npz(tgt_fix_dict, tgt_armature, frame_base=frame_start)


def blender_free_post_process(motion_dict: dict) -> dict:
    """
    post processing for qt motion dict, i.e. rm foot sliding && fix jiter

    Args:
        motion_dict (_type_): _description_
    """
    tik = time.time()
    processer = MotionPostProcesser()
    result_npz_dict = processer(motion_dict)

    logger.debug(f"blender free post process done! used time:{time.time() - tik:.4f}")

    return result_npz_dict


def blender_post_process(
    src_motion_dict: dict,
    src_armature: bpy.types.Object,
    tgt_armature: bpy.types.Object,
    frame_start: int = 1,
) -> dict:
    """
    post processing for tgt aramture, i.e. rm foot sliding && fix jiter
    First detect foot sliding on qt motion dict, then retargeting, finally blender ik

    Args:
        src_motion_dict (dict): qt motion dict
        src_armature (bpy.types.Object): qt armature
        tgt_armature (bpy.types.Object): user armature
        frame_start (int, optional): _description_. Defaults to 1.

    Returns:
        dict: _description_
    """
    tik = time.time()
    processer = MotionPostProcesser()

    src_motion_dict = processer.reorder_motion_data(
        src_motion_dict['joint_names'], processer.skeleton.full_names, src_motion_dict
    )
    sliding_range, _, _ = processer.sliding_processer.detact_fs(src_motion_dict)  ## based on qt

    load_npz(src_motion_dict, src_armature, frame_base=frame_start)
    retarget_src2tgt(src_armature, tgt_armature, ret_npz=False)

    user_fix_dict = blender_auto_post_process(tgt_armature, sliding_range)

    logger.debug(f"blender post process done! used time: {time.time() - tik:.4f}")

    return user_fix_dict


def copy_keyframes(armature: bpy.types.Object) -> None:
    global KEYFRAMES_BACKUP

    KEYFRAMES_BACKUP[armature.name] = {
        "timestamp": datetime.datetime.now(),
        "fcurves": [],
        "frame_range": None,
    }

    action = armature.animation_data.action
    if not action:
        return KEYFRAMES_BACKUP[armature.name]

    for fcurve in action.fcurves:
        fcurve_backup = {
            "data_path": fcurve.data_path,
            "array_index": fcurve.array_index,
            "keyframe_points": [(key.co.x, key.co.y) for key in fcurve.keyframe_points],
        }
        KEYFRAMES_BACKUP[armature.name]["fcurves"].append(fcurve_backup)

    KEYFRAMES_BACKUP[armature.name]["frame_range"] = (action.frame_start, action.frame_end)


def reset_keyframes(
    armature: bpy.types.Object,
    delete_all: bool = True,
    exclude_slice: tuple[int, int] = None,
) -> bpy.types.Object:
    """
    根据备份数据恢复关键帧信息。

    参数:
        armature (bpy.types.Object): 要恢复关键帧的骨架对象。
        delete_all (bool): 是否清除现有的动画数据。
                           - True: 清除所有现有动画数据并恢复备份的关键帧（排除指定范围）。
                           - False: 仅恢复备份的关键帧，不删除其他关键帧。
        exclude_slice (tuple[int, int] or None): 指定不恢复的帧范围(start, end)。
                           - None: 恢复所有帧（默认逻辑）。
                           - 传入一个元组，比如 (10, 20)，则不恢复这部分帧范围内的关键帧。
    返回:
        bpy.types.Object: 恢复关键帧后的骨架对象。
    """
    global KEYFRAMES_BACKUP

    backup_data = KEYFRAMES_BACKUP.get(armature.name)
    backup_data['timestamp'] = datetime.datetime.now()

    if not backup_data:
        return armature  # 没有备份数据，直接返回

    # 如果指定了排除的帧范围，创建一个集合用于快速查找
    if exclude_slice is not None:
        if not (isinstance(exclude_slice, tuple) and len(exclude_slice) == 2):
            raise ValueError("exclude_slice must be a tuple of (start, end)")
        exclude_start, exclude_end = exclude_slice
        exclude_frames_set = set(range(exclude_start, exclude_end + 1))
    else:
        exclude_start, exclude_end = None, None
        exclude_frames_set = None

    if delete_all:
        # 清除现有动画数据
        armature.animation_data_clear()

        # 创建新的动作
        anim_data = armature.animation_data_create()
        action = bpy.data.actions.new("RestoredAction")
        anim_data.action = action

        # 恢复 F-Curves
        for fcurve_data in backup_data["fcurves"]:
            data_path = fcurve_data["data_path"]
            array_index = fcurve_data["array_index"]
            keyframe_points = fcurve_data["keyframe_points"]

            # 为每个通道创建新的 F-Curve
            fcurve = action.fcurves.new(data_path, index=array_index)
            for frame, value in keyframe_points:
                fcurve.keyframe_points.insert(frame, value)
            fcurve.update()

    else:
        # 获取当前动作，如果没有动作则创建一个新的动作
        anim_data = armature.animation_data
        if not anim_data:
            anim_data = armature.animation_data_create()
        action = anim_data.action
        if not action:
            action = bpy.data.actions.new("RestoredAction")
            anim_data.action = action

        # 创建一个映射，方便快速查找现有的 fcurve
        fcurves_map = {(fc.data_path, fc.array_index): fc for fc in action.fcurves}

        # 构建备份中每个 fcurve 的帧集合，用于后续删除不在备份中的关键帧
        backup_fcurves_frames = {}
        for fcurve_data in backup_data["fcurves"]:
            key = (fcurve_data["data_path"], fcurve_data["array_index"])
            backup_fcurves_frames[key] = set(int(frame) for frame, _ in fcurve_data["keyframe_points"])

        # 遍历备份的 fcurve 数据，恢复关键帧
        for fcurve_data in backup_data["fcurves"]:
            data_path = fcurve_data["data_path"]
            array_index = fcurve_data["array_index"]
            keyframe_points = fcurve_data["keyframe_points"]

            # 获取或创建对应的 fcurve
            if (data_path, array_index) in fcurves_map:
                fcurve = fcurves_map[(data_path, array_index)]
            else:
                fcurve = action.fcurves.new(data_path, index=array_index)
                fcurves_map[(data_path, array_index)] = fcurve

            for frame, value in keyframe_points:
                frame = int(round(frame))  # 确保帧编号为整数
                if exclude_frames_set and exclude_start <= frame <= exclude_end:
                    continue  # 跳过排除范围内的帧

                # 查找是否已存在该帧的关键帧
                existing_key = None
                for key in fcurve.keyframe_points:
                    if int(round(key.co.x)) == frame:
                        existing_key = key
                        break
                if existing_key:
                    existing_key.co.y = value
                else:
                    fcurve.keyframe_points.insert(frame, value, options={'FAST'})
            fcurve.update()

            # 遍历现有动作的所有 fcurves，删除那些不在备份且不在排除范围内的关键帧
        for fcurve in action.fcurves:
            key_key = (fcurve.data_path, fcurve.array_index)
            backup_frames = backup_fcurves_frames.get(key_key, set())

            frames_to_delete = []
            for key in fcurve.keyframe_points:
                frame = int(round(key.co.x))
                if exclude_frames_set and exclude_start <= frame <= exclude_end:
                    continue
                if frame not in backup_frames:
                    frames_to_delete.append(frame)

            # 再次遍历，删除匹配这些帧的 key
            # 同样最好用倒序或收集索引
            for i in reversed(range(len(fcurve.keyframe_points))):
                key = fcurve.keyframe_points[i]
                if int(round(key.co.x)) in frames_to_delete:
                    fcurve.keyframe_points.remove(key)

            fcurve.update()

    # 恢复帧范围（可选）
    if backup_data.get("frame_range"):
        start_bak, end_bak = backup_data["frame_range"]

        if delete_all:
            if exclude_frames_set:
                # 设置帧范围为排除范围内的最小和最大帧
                action.frame_start = min(exclude_frames_set)
                action.frame_end = max(exclude_frames_set)
            else:
                action.frame_start, action.frame_end = start_bak, end_bak
        else:
            if exclude_frames_set:
                # 扩展帧范围以包含排除范围
                action.frame_start = min(action.frame_start, min(exclude_frames_set))
                action.frame_end = max(action.frame_end, max(exclude_frames_set))
            else:
                if action:
                    action.frame_start = min(action.frame_start, start_bak)
                    action.frame_end = max(action.frame_end, end_bak)

    return armature


def reset_nla(armature: bpy.types.Object, track_name: str) -> None:
    """
    删除指定 Armature 上名称为 track_name 的 NLA Track
    :param armature: Blender 对象，通常为 Armature
    :param track_name: 要删除的 NLA Track 的名称
    """
    if not armature.animation_data or not armature.animation_data.nla_tracks:
        logger.warning(f"Armature {armature.name} does not have NLA Tracks。")
        return

    anim_data = armature.animation_data

    # 遍历 NLA Tracks 并删除匹配的 Track
    for track in anim_data.nla_tracks:
        if track.name == track_name:
            anim_data.nla_tracks.remove(track)
            logger.info(f"NLA Track '{track_name}' has been deleted successfully. ")
            return

    logger.warning(f"Armature {armature.name} does not have a NLA Track named '{track_name}'. ")


def check_armatures_topology_and_rest_pose(armature1: bpy.types.Object, armature2: bpy.types.Object) -> bool:
    """
    检查两个 armature 是否具有相同的骨骼拓扑和 rest pose。

    Args:
        armature1 (bpy.types.Object): 第一个 Armature 对象
        armature2 (bpy.types.Object): 第二个 Armature 对象

    Returns:
        bool: 如果两个 armature 完全相同，返回 True, 否则返回 False
    """
    # 检查类型
    if armature1.type != 'ARMATURE' or armature2.type != 'ARMATURE':
        logger.debug("One or both objects are not armatures.")
        return False

    # 获取骨骼列表
    bones1 = armature1.data.bones
    bones2 = armature2.data.bones

    # 检查骨骼数量是否相同
    if len(bones1) != len(bones2):
        logger.debug("Bone count mismatch.")
        return False

    # 遍历骨骼，检查名称和父子关系
    for bone1, bone2 in zip(bones1, bones2, strict=False):
        if bone1.name != bone2.name:
            logger.debug(f"Bone name mismatch: {bone1.name} != {bone2.name}")
            return False
        if (bone1.parent is None) != (bone2.parent is None):
            logger.debug(f"Bone parent mismatch for bone {bone1.name}.")
            return False
        if bone1.parent and bone2.parent and bone1.parent.name != bone2.parent.name:
            logger.debug(f"Bone parent name mismatch for bone {bone1.name}.")
            return False

    # TODO: 检查 rest pose 矩阵
    # for bone1, bone2 in zip(bones1, bones2):
    #     if not bone1.matrix_local == bone2.matrix_local:
    #         logger.debug(f"Rest pose mismatch for bone {bone1.name}.")
    #         return False

    logger.debug("Armatures have identical topology and rest pose.")
    return True


def find_discontinuities_simple(keyframe_list: list) -> tuple:
    """
    Identify discontinuities in a sorted list of keyframes.

    Args:
        keyframe_list (list): A list of integers representing keyframe indices.

    Returns:
        tuple:
            pre_end (int): The last keyframe index before the first gap (discontinuity).
            post_start (int): The first keyframe index after the last gap (discontinuity).
            intermediate_values (list): A list of keyframe indices between the discontinuities.

    Example:
        Input:
            keyframe_list = [1, 2, 3, 7, 8, 12]
        Output:
            pre_end = 3, post_start = 12, intermediate_values = [7, 8]
    """
    # Ensure the keyframe list is sorted in ascending order
    keyframe_list = sorted(keyframe_list)

    idx1 = None  # forward search
    idx2 = None  # backward search

    # Forward search: Find the first gap in the sequence
    for i in range(1, len(keyframe_list)):
        if keyframe_list[i] - keyframe_list[i - 1] > 1:
            idx1 = i - 1
            break

    # Backward search: Find the last gap in the sequence
    for i in range(len(keyframe_list) - 1, 0, -1):
        if keyframe_list[i] - keyframe_list[i - 1] > 1:
            idx2 = i
            break

    # Extract results based on identified discontinuities
    if idx1 is not None and idx2 is not None:
        pre_end = keyframe_list[idx1]
        post_start = keyframe_list[idx2]
        intermediate_values = keyframe_list[idx1 + 1 : idx2]
    else:
        pre_end, post_start, intermediate_values = None, None, []

    return pre_end, post_start, intermediate_values


def get_strips_start_end(armature: bpy.types.Object, strips_list: list) -> list:
    """
    Retrieve start and end frame information for specified NLA strips.

    This function iterates through all NLA tracks of the given armature object and retrieves the start and end frame
    information for strips that match those in the provided `strips_list`.

    Args:
        armature (bpy.types.Object): The armature object containing the NLA tracks.
        strips_list (list): A list of NLA strips to retrieve frame information for.

    Returns:
        list: A sorted list of tuples containing:
            - The NLA strip object.
            - The start frame (float).
            - The end frame (float).

    Example:
        Input:
            strips_list = [strip1, strip2]
        Output:
            [(strip1, 1.0, 24.0), (strip2, 25.0, 48.0)]
    """
    strips_info = []

    # Iterate over all NLA tracks of the armature
    for track in armature.animation_data.nla_tracks:
        for strip in track.strips:
            if strip in strips_list:  # Check if the strip is in the target list
                strips_info.append((strip, strip.frame_start, strip.frame_end))

    # Sort the collected strips information by start frame
    strips_info.sort(key=lambda x: x[1])

    return strips_info


def check_no_overlap(strip_info: tuple) -> bool:
    """
    Check for overlapping time ranges in sorted strip information.

    This function evaluates a sorted list of strip information tuples, which contain the strip name, start frame,
    and end frame. It determines whether any of the strips have overlapping time ranges.

    Args:
        strip_info (list): A list of tuples, where each tuple contains:
            - strip_name (Any): The name or identifier of the strip.
            - frame_start (float): The starting frame of the strip.
            - frame_end (float): The ending frame of the strip.

    Returns:
        bool: True if there are no overlaps between the strips; False if overlaps are detected.

    Example:
        Input:
            strip_info = [("Strip1", 1.0, 10.0), ("Strip2", 10.0, 20.0), ("Strip3", 19.0, 30.0)]
        Output:
            False (since Strip2 and Strip3 overlap)
    """
    for i in range(len(strip_info) - 1):
        # Current strip's end frame
        current_end = strip_info[i][2]
        # Next strip's start frame
        next_start = strip_info[i + 1][1]

        # If current strip's end overlaps or meets the next strip's start
        if current_end >= next_start:
            return False

    return True


def check_overlap_vaild(strips_info):
    """
    检查两个strip的范围重合情况。
    返回值：
    - "Partial Overlap": 有重合, 且重合范围小于两个strip各自的范围。
    - "Adjacent": 两个strip相邻但没有重合。
    - "No Overlap": 两个strip完全不重合, 也不相邻。
    - "Full Inclusion": 一个strip完全包含另一个strip。

    :param strip_data: List of tuples, each containing (strip_name, start_frame, end_frame)
                       e.g., [(strip1, 1.0, 24.0), (strip2, 25.0, 48.0)]
    :return: A string indicating the overlap condition.
    """
    if len(strips_info) != 2:
        return

    _, start1, end1 = strips_info[0]
    _, start2, end2 = strips_info[1]

    # Calculate overlap range
    overlap_start = max(start1, start2)
    overlap_end = min(end1, end2)

    # Check if one strip fully includes the other
    if (start1 <= start2 and end1 >= end2) or (start2 <= start1 and end2 >= end1):
        return "Full Inclusion"

    # Check if there is overlap
    if overlap_start < overlap_end:
        overlap_range = overlap_end - overlap_start
        strip1_range = end1 - start1
        strip2_range = end2 - start2

        # Check if overlap range is smaller than both strip ranges
        if overlap_range < strip1_range and overlap_range < strip2_range:
            return "Partial Overlap"

    # Check if strips are adjacent
    if end1 == start2 or start1 == end2:
        return "Adjacent"

    return "No Overlap"


""" utils funcs """


def get_armature_anim_start_end(armature: bpy.types.Object):
    if armature.animation_data and armature.animation_data.action:
        frame_range = armature.animation_data.action.frame_range
        frame_start = int(frame_range[0])  # Start frame
        frame_end = int(frame_range[1])  # End frame
    else:
        frame_start = None
        frame_end = None

    return frame_start, frame_end


def get_bone_gpos(armature, bone: bpy.types.Bone, frame: int):
    bpy.context.scene.frame_set(frame)

    gpos = (armature.matrix_world @ bone.matrix).to_translation()
    return gpos


def cal_suggest_trans_len(gpos1, gpos2):
    dis = np.linalg.norm(gpos1 - gpos2)
    sug_trans_len = dis * 30.0

    return int(sug_trans_len)


PRE_TRANS_LEN = -9999


def monitor_armature_changes(scene: bpy.types.Scene):
    """
    Automatically update blending settings for armatures based on animation changes.

    Args:
        scene (bpy.types.Scene): The current scene containing the armatures and blending settings.

    Notes:
        - Updates transition length and context lengths dynamically.
        - Exits early if `auto_update_trans_len` is disabled or armatures are missing.
    """
    global PRE_TRANS_LEN
    current_frame = scene.frame_current

    # 自动更新blending settings
    blending_setting = scene.blending_settings
    armature1 = scene.armature1
    armature2 = scene.armature2

    if not armature1 or not armature2:
        return

    armature1_start, armature1_end = get_armature_anim_start_end(armature1)
    armature2_start, armature2_end = get_armature_anim_start_end(armature2)

    if armature1_end is None or armature2_start is None:
        return

    if not blending_setting.auto_update_trans_len:
        scene.frame_set(current_frame)
        return

    armature1_root = armature1.pose.bones[find_root_bone_name(armature1)]
    armature2_root = armature2.pose.bones[find_root_bone_name(armature2)]

    armature1_end_gpos = get_bone_gpos(armature1, armature1_root, armature1_end)
    armature2_start_gpos = get_bone_gpos(armature2, armature2_root, armature2_start)

    sug_trans_len = cal_suggest_trans_len(armature1_end_gpos, armature2_start_gpos)

    if sug_trans_len != PRE_TRANS_LEN:
        blending_setting.trans_len = sug_trans_len

        blending_setting.pre_context_len = min(armature1_end - armature1_start + 1, int(sug_trans_len / 2))
        blending_setting.next_context_len = min(armature2_end - armature2_start + 1, int(sug_trans_len / 2))

        PRE_TRANS_LEN = sug_trans_len

    bpy.context.scene.frame_set(current_frame)


def clean_old_backups(expiry_time: int = 60 * 1):
    """
    清理超过指定时间未使用的备份数据。

    参数:
        expiry_time (int): 备份数据的有效期(秒), 默认为 10 分钟。
    """
    global KEYFRAMES_BACKUP

    current_time = datetime.datetime.now()
    keys_to_delete = []

    # 遍历所有备份数据，查找过期的条目
    for armature_name, backup_data in KEYFRAMES_BACKUP.items():
        backup_time = backup_data.get("timestamp")
        if not backup_time:
            keys_to_delete.append(armature_name)
            continue
        # 计算时间差，判断是否过期
        elapsed_time = (current_time - backup_time).total_seconds()
        if elapsed_time > expiry_time:
            keys_to_delete.append(armature_name)

    # 删除过期的条目
    for key in keys_to_delete:
        del KEYFRAMES_BACKUP[key]
        logger.debug(f"已删除过期的备份数据：{key}")


def clean_old_backups_timer():
    clean_old_backups(expiry_time=60 * 100)  # 100 minutes为备份数据的有效期

    return 60 * 30  # 30 minutes调用一次
