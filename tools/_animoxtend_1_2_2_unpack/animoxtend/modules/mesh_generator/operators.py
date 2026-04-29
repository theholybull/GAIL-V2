"""
Operators to handle the addon functionality.
"""

import asyncio
import json
import os
import threading

import bpy
import bpy.types
from bpy.types import Operator

from ...utils.http import RequestException, XClient
from ...utils.logging import logger
from .api import tripo_api


class CheckOnlineMixin:
    @classmethod
    def poll(cls, context):
        return XClient.check_online_access()


class MESH_ARTIFICER_check_wallet(Operator, CheckOnlineMixin):
    bl_idname = "mesh_artificer.check_wallet"
    bl_label = "Check Wallet"
    bl_description = "Check the wallet balance"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        api_key = context.scene.tripo_api_key
        balance, error = tripo_api.check_wallet(api_key)
        if error:
            logger.exception({"ERROR"}, error)
        else:
            self.report({"INFO"}, f"Balance: {balance}")
        return {"FINISHED"}


class MESH_ARTIFICER_select_image(Operator):
    bl_idname = "mesh_artificer.select_image"
    bl_label = "Select Image"
    bl_description = "Select an image"
    bl_options = {"REGISTER", "UNDO", "BLOCKING"}

    filepath: bpy.props.StringProperty(
        name="File path",
        description="The path of the selected file",
        maxlen=1024,
        default="",
    )

    filter_glob: bpy.props.StringProperty(default="*.jpg;*.jpeg;*.png", options={"HIDDEN"})

    view_type: bpy.props.StringProperty(
        name="View Type",
        description="The type of the view",
        default="",
    )

    def invoke(self, context, event):
        context.window_manager.fileselect_add(self)
        return {"RUNNING_MODAL"}

    def execute(self, context):
        scn = context.scene
        MV_props = scn.multi_view_props
        view_map = {
            "Front View": MV_props.front_view,
            "Back View": MV_props.back_view,
            "Left View": MV_props.left_view,
            "Right View": MV_props.right_view,
        }

        view_prop = view_map.get(self.view_type)
        if not view_prop:
            logger.exception({"ERROR"}, f"Invalid view type: {self.view_type}")
            return {"CANCELLED"}

        # 检查文件扩展名
        valid_extensions = {".jpeg", ".png", ".jpg"}
        ext = os.path.splitext(self.filepath)[1].lower()

        if ext not in valid_extensions:
            logger.exception({"ERROR"}, f"unsupported file format: {ext}")
            return {"CANCELLED"}

        try:
            # 清理旧的预览图像
            if view_prop.ma_preview_image:
                bpy.data.images.remove(view_prop.ma_preview_image)

            # 加载新图像
            image = bpy.data.images.load(self.filepath)
            image.use_fake_user = True

            # 保存图片和路径
            view_prop.ma_preview_image = image
            view_prop.image_path = self.filepath
            view_prop.show_preview = True

            # 强制更新界面
            for area in context.screen.areas:
                area.tag_redraw()

        except Exception as e:
            logger.exception({"ERROR"}, f"加载图像失败: {str(e)}")
            return {"CANCELLED"}

        return {"FINISHED"}


class MESH_ARTIFICER_upload_images(Operator, CheckOnlineMixin):
    bl_idname = "mesh_artificer.upload_images"
    bl_label = "Upload Image"
    bl_description = "Upload an image to the Tripo API"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        api_key = context.scene.tripo_api_key
        MV_props = context.scene.multi_view_props
        for view_prop in [
            MV_props.front_view,
            MV_props.back_view,
            MV_props.left_view,
            MV_props.right_view,
        ]:
            if view_prop.show_preview and view_prop.image_path:
                image_path = view_prop.image_path
                image_token, error = tripo_api.upload_image(api_key, image_path)
                if error:
                    logger.exception(error)
                    continue
                else:
                    view_prop.image_token = image_token["data"]["image_token"]
                    self.report({"INFO"}, f"Image uploaded successfully: {image_path}")
        return {"FINISHED"}


class MESH_ARTIFICER_frontview_to_model(Operator, CheckOnlineMixin):
    bl_idname = "mesh_artificer.frontview_to_model"
    bl_label = "Front View to Model"
    bl_description = "Convert a front view to a model"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        api_key = context.scene.tripo_api_key
        MV_props = context.scene.multi_view_props
        image_token = MV_props.front_view.image_token

        task_result, error = tripo_api.image_to_model(api_key, image_token, context.scene.generate_style_ui)
        if error:
            logger.exception({"ERROR"}, error)
            return {"CANCELLED"}

        task_id = task_result["data"]["task_id"]
        logger.info(f"image_to_model: {task_id} success!")
        # 添加新任务到列表
        task_list = context.scene.task_list.task_list
        new_task = task_list.add()
        new_task.task_id = task_id
        new_task.task_type = "I2M"
        new_task.task_progress = 0
        new_task.is_monitoring = True

        # 自动触发导入操作
        bpy.ops.mesh_artificer.import_result(task_id=task_id)
        return {"FINISHED"}


class MESH_ARTIFICER_image_to_model(Operator):
    bl_idname = "mesh_artificer.image_to_model"
    bl_label = "Image to Model"
    bl_description = "Convert an image to a model"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        MV_props = context.scene.multi_view_props

        bpy.ops.mesh_artificer.upload_images()

        selected_views = [
            MV_props.front_view.show_preview,
            MV_props.back_view.show_preview,
            MV_props.left_view.show_preview,
            MV_props.right_view.show_preview,
        ]

        num_selected_views = sum(selected_views)
        if num_selected_views == 0:
            self.report({"ERROR"}, "No view selected")
            return {"CANCELLED"}
        elif num_selected_views == 1 and MV_props.front_view.show_preview:
            bpy.ops.mesh_artificer.frontview_to_model()
        elif num_selected_views >= 2:
            bpy.ops.mesh_artificer.multiview_to_model()
        return {"FINISHED"}


class MESH_ARTIFICER_text_to_model(Operator, CheckOnlineMixin):
    bl_idname = "mesh_artificer.text_to_model"
    bl_label = "Text to Model"
    bl_description = "Convert a text to a model"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        api_key = context.scene.tripo_api_key
        prompt = context.scene.text_prompt
        task_result, error = tripo_api.text_to_model(api_key, prompt, context.scene.generate_style_ui)
        if error:
            logger.exception({"ERROR"}, error)
            return {"CANCELLED"}
        task_id = task_result["data"]["task_id"]
        logger.info(f"text_to_model: {task_id} success!")

        task_list = context.scene.task_list.task_list
        new_task = task_list.add()
        new_task.task_id = task_id
        new_task.task_type = "T2M"
        new_task.task_progress = 0
        new_task.is_monitoring = True

        # 自动触发导入操作
        bpy.ops.mesh_artificer.import_result(task_id=task_id)

        return {"FINISHED"}


class MESH_ARTIFICER_multiview_to_model(Operator, CheckOnlineMixin):
    bl_idname = "mesh_artificer.multiview_to_model"
    bl_label = "Multiview to Model"
    bl_description = "Convert a multiview to a model"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        api_key = context.scene.tripo_api_key
        logger.info("Starting multiview_to_model operator")

        MV_props = context.scene.multi_view_props
        image_tokens = [
            view_prop.image_token if view_prop.show_preview and view_prop.image_token else "None"
            for view_prop in [
                MV_props.front_view,
                MV_props.left_view,
                MV_props.back_view,
                MV_props.right_view,
            ]
        ]
        image_token_list = []
        for image_token in image_tokens:
            if image_token == "None":
                logger.info("Adding empty object for None token")
                image_token_list.append({})
            else:
                logger.info(f"Adding image object for token: {image_token}")
                image_token_list.append({"type": "jpg", "file_token": image_token})

        logger.info(f"Created image_list: {image_token_list}")

        task_result, error = tripo_api.multiview_to_model(api_key=api_key, image_token_list=image_token_list)
        if error:
            logger.exception(f"multiview_to_model error: {error}")
            return {"CANCELLED"}

        task_id = task_result["data"]["task_id"]
        logger.info(f"text_to_model: {task_id} success!")

        task_list = context.scene.task_list.task_list
        new_task = task_list.add()
        new_task.task_id = task_id
        new_task.task_type = "MV2M"
        new_task.task_progress = 0
        new_task.is_monitoring = True
        logger.info("Multiview to model successful")

        # 自动触发导入操作
        bpy.ops.mesh_artificer.import_result(task_id=task_id)

        return {"FINISHED"}


def get_task_id_from_context(context):
    """从context中获取task id，优先使用active object"""
    # 检查是否有活动对象
    active_obj = context.active_object
    if active_obj:
        name = active_obj.name
        if name.startswith("tripo_"):
            # 移除前缀 "tripo_mesh_" 或 "tripo_node_"
            name = name.replace("tripo_mesh_", "").replace("tripo_node_", "")
            # 移除可能存在的数字后缀（如 ".001"）
            name = name.split(".")[0]
            if name:  # 确保处理后的名称不为空
                return name

    # 如果没有活动对象或对象名称不符合格式，使用task list
    task_list = context.scene.task_list
    active_index = task_list.active_task_index
    task_list = task_list.task_list
    real_index = len(task_list) - active_index - 1

    if real_index >= 0 and real_index < len(task_list):
        return task_list[real_index].task_id

    return None


class MESH_ARTIFICER_rig_check(Operator, CheckOnlineMixin):
    bl_idname = "mesh_artificer.rig_check"
    bl_label = "Rig Check"
    bl_description = "Check the rig"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        api_key = context.scene.tripo_api_key

        task_id = get_task_id_from_context(context)
        if not task_id:
            logger.exception({"ERROR"}, "No valid task selected")
            return {"CANCELLED"}

        task_result, error = tripo_api.rig_check(api_key, task_id)
        if error:
            logger.exception({"ERROR"}, error)
            return {"CANCELLED"}

        task_id = task_result["data"]["task_id"]
        task_list = context.scene.task_list.task_list
        new_task = task_list.add()
        new_task.task_id = task_id
        new_task.task_type = "RC"
        new_task.task_progress = 0
        new_task.is_monitoring = True

        # 自动触发导入操作
        bpy.ops.mesh_artificer.import_result(task_id=task_id)
        return {"FINISHED"}


class MESH_ARTIFICER_rig_model(Operator, CheckOnlineMixin):
    bl_idname = "mesh_artificer.rig_model"
    bl_label = "Rig Model"
    bl_description = "Rig a model"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        api_key = context.scene.tripo_api_key

        task_id = get_task_id_from_context(context)
        if not task_id:
            logger.exception({"ERROR"}, "No valid task selected")
            return {"CANCELLED"}

        task_result, error = tripo_api.rig_model(api_key, task_id)
        if error:
            logger.exception({"ERROR"}, error)
            return {"CANCELLED"}

        task_id = task_result["data"]["task_id"]
        task_list = context.scene.task_list.task_list
        new_task = task_list.add()
        new_task.task_id = task_id
        new_task.task_type = "RIG"
        new_task.task_progress = 0
        new_task.is_monitoring = True

        # 自动触发导入操作
        bpy.ops.mesh_artificer.import_result(task_id=task_id)
        return {"FINISHED"}


class MESH_ARTIFICER_retarget_animation(Operator):
    bl_idname = "mesh_artificer.retarget_animation"
    bl_label = "Retarget Animation"
    bl_description = "Retarget an animation"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        logger.info("Retarget Animation")
        return {"FINISHED"}


class MESH_ARTIFICER_texture_generate(Operator, CheckOnlineMixin):
    bl_idname = "mesh_artificer.texture_generate"
    bl_label = "Texture Generate"
    bl_description = "Generate textures"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        api_key = context.scene.tripo_api_key
        texture_alignment = context.scene.texture_alignment_ui
        texture_quality = context.scene.texture_quality_ui
        task_id = get_task_id_from_context(context)
        if not task_id:
            logger.exception({"ERROR"}, "No valid task selected")
            return {"CANCELLED"}
        task_result, error = tripo_api.texture_generate(api_key, task_id, texture_alignment, texture_quality)
        if error:
            logger.exception({"ERROR"}, error)
            return {"CANCELLED"}

        task_id = task_result["data"]["task_id"]
        task_list = context.scene.task_list.task_list
        new_task = task_list.add()
        new_task.task_id = task_id
        new_task.task_type = "TEX"
        new_task.task_progress = 0
        new_task.is_monitoring = True

        # 自动触发导入操作
        bpy.ops.mesh_artificer.import_result(task_id=task_id)
        return {"FINISHED"}


class MESH_ARTIFICER_refine_model(Operator, CheckOnlineMixin):
    bl_idname = "mesh_artificer.refine_model"
    bl_label = "Refine Model"
    bl_description = "Refine a model"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        api_key = context.scene.tripo_api_key
        task_id = get_task_id_from_context(context)
        if not task_id:
            logger.exception({"ERROR"}, "No valid task selected")
            return {"CANCELLED"}
        task_result, error = tripo_api.refine_model(api_key, task_id)
        if error:
            logger.exception({"ERROR"}, error)
            return {"CANCELLED"}
        task_id = task_result["data"]["task_id"]
        task_list = context.scene.task_list.task_list
        new_task = task_list.add()
        new_task.task_id = task_id
        new_task.task_type = "REFINE"
        new_task.task_progress = 0
        new_task.is_monitoring = True

        # 自动触发导入操作
        bpy.ops.mesh_artificer.import_result(task_id=task_id)
        return {"FINISHED"}


class MESH_ARTIFICER_stylize_model(Operator, CheckOnlineMixin):
    bl_idname = "mesh_artificer.stylize_model"
    bl_label = "Stylize Model"
    bl_description = "Stylize a model"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        api_key = context.scene.tripo_api_key
        task_id = get_task_id_from_context(context)
        pp_style = context.scene.pp_style_ui
        if not task_id:
            logger.exception({"ERROR"}, "No valid task selected")
            return {"CANCELLED"}
        task_result, error = tripo_api.stylize_model(
            api_key,
            task_id,
            pp_style,
        )
        if error:
            logger.exception({"ERROR"}, error)
            return {"CANCELLED"}
        task_id = task_result["data"]["task_id"]
        task_list = context.scene.task_list.task_list
        new_task = task_list.add()
        new_task.task_id = task_id
        new_task.task_type = pp_style.upper()
        new_task.task_progress = 0
        new_task.is_monitoring = True

        # 自动触发导入操作
        bpy.ops.mesh_artificer.import_result(task_id=task_id)
        return {"FINISHED"}


class MESH_ARTIFICER_convert_model(Operator, CheckOnlineMixin):
    bl_idname = "mesh_artificer.convert_model"
    bl_label = "Convert Model"
    bl_description = "Convert a model"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        api_key = context.scene.tripo_api_key
        quad = context.scene.quad_ui
        symmetry = context.scene.symmetry_ui
        face_limit = context.scene.face_limit_ui
        task_id = get_task_id_from_context(context)
        if not task_id:
            logger.exception({"ERROR"}, "No valid task selected")
            return {"CANCELLED"}
        task_result, error = tripo_api.convert_model(api_key, task_id, quad, symmetry, face_limit)
        if error:
            logger.exception({"ERROR"}, error)
            return {"CANCELLED"}
        task_id = task_result["data"]["task_id"]
        task_list = context.scene.task_list.task_list
        new_task = task_list.add()
        new_task.task_id = task_id
        new_task.task_type = "CONVERT"
        new_task.task_progress = 0
        new_task.is_monitoring = True

        # 自动触发导入操作
        bpy.ops.mesh_artificer.import_result(task_id=task_id)
        return {"FINISHED"}


class MESH_ARTIFICER_OT_remove_task(Operator):
    bl_idname = "mesh_artificer.remove_task"
    bl_label = "Remove Task"
    bl_description = "删除选中的任务"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        task_list = context.scene.task_list
        index = task_list.active_task_index

        # 转换为实际的索引
        real_index = len(task_list.task_list) - index - 1

        if real_index >= 0 and real_index < len(task_list.task_list):
            task_list.task_list.remove(real_index)
            # 更新活动索引
            task_list.active_task_index = min(index, len(task_list.task_list) - 1)

        return {"FINISHED"}


class MESH_ARTIFICER_OT_clear_tasks(Operator):
    bl_idname = "mesh_artificer.clear_tasks"
    bl_label = "Clear Tasks"
    bl_description = "清空所有任务"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        task_list = context.scene.task_list.task_list
        task_list.clear()
        context.scene.task_list.active_task_index = -1
        return {"FINISHED"}


class MESH_ARTIFICER_OT_IMPORT_RESULT(Operator, CheckOnlineMixin):
    bl_idname = "mesh_artificer.import_result"
    bl_label = "Import Result"
    bl_description = "Import the result"
    bl_options = {"REGISTER", "UNDO"}

    task_id: bpy.props.StringProperty(name="Task ID", description="Task ID to import", default="")

    # 将类变量改为实例变量
    def __init__(self):
        self._finished = False
        self._data = None
        self._timer = None
        self._thread = None
        self._websocket = None
        logger.info("Operator initialized")

    def execute(self, context):
        logger.info(f"Execute called with task_id: {self.task_id}")
        if self.task_id:
            for task in context.scene.task_list.task_list:
                if task.task_id == self.task_id:
                    # 检查是否已有下载文件
                    existing_file = self.check_existing_files(self.task_id)
                    if existing_file and task.task_progress == 100:
                        logger.info(f"Found existing file and task is complete, importing: {existing_file}")
                        bpy.ops.import_scene.gltf(filepath=existing_file)
                        return {"FINISHED"}

                    # 启动监控
                    logger.info("Starting task monitoring...")
                    self._timer = context.window_manager.event_timer_add(0.1, window=context.window)
                    context.window_manager.modal_handler_add(self)

                    self._thread = threading.Thread(target=self.watch_task_thread)
                    self._thread.daemon = True  # 设置为守护线程
                    self._thread.start()

                    task.is_monitoring = True
                    return {"RUNNING_MODAL"}

            return {"CANCELLED"}
        else:
            self.report({"ERROR"}, "No task ID provided")
            return {"CANCELLED"}

    def watch_task_thread(self):
        """监视任务线程函数"""
        logger.info("Watch task thread started")
        task_id = self.task_id
        api_key = bpy.context.scene.tripo_api_key

        # 创建新的事件循环
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(self.receive_one(task_id, api_key))
        except Exception as e:
            logger.exception(f"Error in watch_task_thread: {e}")
        finally:
            loop.close()
            logger.info("Watch task thread finished")

    async def receive_one(self, task_id, api_key):
        import websockets

        logger.info(f"Starting websocket connection for task: {task_id}")
        url = f"wss://api.tripo3d.ai/v2/openapi/task/watch/{task_id}"
        headers = {"Authorization": f"Bearer {api_key}"}

        try:
            async with websockets.connect(url, additional_headers=headers) as websocket:
                logger.info("Websocket connected")
                self._websocket = websocket
                while not self._finished:
                    try:
                        message = await websocket.recv()
                        logger.info(f"Received message: {message}")
                        data = json.loads(message)
                        status = data["data"]["status"]
                        self._data = data

                        progress = data["data"].get("progress", 0)
                        logger.info(f"Progress update: {progress}%")

                        # 更新进度
                        def create_update_progress(current_progress, current_status):
                            def update_progress():
                                for task in bpy.context.scene.task_list.task_list:
                                    if task.task_id == task_id:
                                        task.task_progress = current_progress
                                        if current_status == "success":
                                            task.task_progress = 100
                                        break
                                return None

                            return update_progress

                        bpy.app.timers.register(create_update_progress(progress, status))

                        if status not in ["running", "queued"]:
                            logger.info(f"Task finished with status: {status}")
                            self._finished = True
                            break

                    except json.JSONDecodeError as e:
                        logger.error(f"JSON decode error: {e}")
                        continue
                    except Exception as e:
                        logger.error(f"Error processing message: {e}")
                        break

        except Exception as e:
            logger.exception(f"WebSocket error: {e}")
        finally:
            self._finished = True

    def check_existing_files(self, task_id):
        base_dir = os.path.join(bpy.context.scene.render.filepath, "mesh_artificer")
        logger.info(f"Checking for existing files in: {base_dir}")
        import_list = ["pbr_model", "base_model", "model"]

        for item in import_list:
            download_dir = os.path.join(base_dir, item)
            if os.path.exists(download_dir):
                for file in os.listdir(download_dir):
                    if file.startswith(task_id) and file.endswith((".glb", ".gltf")):
                        file_path = os.path.join(download_dir, file)
                        logger.info(f"Found existing file: {file_path}")
                        return file_path
        logger.info("No existing files found")
        return None

    def modal(self, context, event):
        if event.type == "TIMER":
            if self._finished:
                self.cancel(context)
                if self._data:
                    logger.info(f"Task completed: {self._data}")
                    self.process_completed_task(self._data)
                    return {"FINISHED"}
                return {"CANCELLED"}

            # 强制更新UI
            for area in context.screen.areas:
                area.tag_redraw()

        return {"PASS_THROUGH"}

    def cancel(self, context):
        if self._timer:
            context.window_manager.event_timer_remove(self._timer)
        self._finished = True
        if self._thread:
            self._thread.join()

        # 重置监控状态
        for task in context.scene.task_list.task_list:
            if task.task_id == self.task_id:
                task.is_monitoring = False
                break

    def process_completed_task(self, data):
        """处理完成的任务"""
        logger.info(f"Processing completed task: {data}")
        try:
            if data["data"]["status"] == "success":
                logger.info("Task completed successfully!")
                output = data["data"]["output"]
                logger.info(f"Output: {output}")

                # 获取任务类型
                task_type = None
                for task in bpy.context.scene.task_list.task_list:
                    if task.task_id == self.task_id:
                        task_type = task.task_type
                        break

                # 下载所有输出文件
                output_list = ["model", "base_model", "pbr_model", "rendered_image"]
                for item in output_list:
                    logger.info(f"Item: {item}: {item in output}")
                    if item in output:
                        file_url = output[item]
                        file_ext = os.path.splitext(file_url.split("?")[0])[1]
                        self.download_files(file_url, item, data["data"]["task_id"] + file_ext)
                logger.info("Files download completed successfully!")

                # 导入模型
                import_list = ["pbr_model", "base_model", "model"]
                for item in import_list:
                    if item in output:
                        file_name = data["data"]["task_id"] + os.path.splitext(output[item].split("?")[0])[1]
                        file_path = self.download_files(output[item], item, file_name)
                        if file_path:
                            bpy.ops.import_scene.gltf(filepath=file_path)

                            # 如果是RIG任务，进行特殊处理
                            if task_type == "RIG":
                                logger.info("Rigged model imported successfully!")

                                # 查找并选择Armature对象
                                armature = None
                                for obj in bpy.data.objects:
                                    if obj.type == "ARMATURE":
                                        armature = obj
                                        break

                                if armature:
                                    logger.info(f"Found armature: {armature.name}")
                                    # 选中Armature
                                    bpy.ops.object.select_all(action="DESELECT")
                                    armature.select_set(True)
                                    bpy.context.view_layer.objects.active = armature

                                    # 进入编辑模式
                                    bpy.ops.object.mode_set(mode="EDIT")

                                    # 获取编辑骨骼
                                    edit_bones = armature.data.edit_bones

                                    # 查找需要的骨骼
                                    l_thigh = edit_bones.get("L_Thigh")
                                    r_thigh = edit_bones.get("R_Thigh")
                                    hip = edit_bones.get("Hip")

                                    if l_thigh and r_thigh and hip:
                                        logger.info("Found all required bones")
                                        # 清除parent
                                        l_thigh.parent = None
                                        r_thigh.parent = None

                                        # 设置新的parent（保持偏移）
                                        l_thigh.parent = hip
                                        r_thigh.parent = hip

                                        # 确保connected属性为False以保持偏移
                                        l_thigh.use_connect = False
                                        r_thigh.use_connect = False
                                    else:
                                        logger.warning("Could not find all required bones")
                                    bpy.ops.object.mode_set(mode="OBJECT")
                                else:
                                    logger.warning("No armature found in imported file")
                            break
                return True
        except Exception as e:
            logger.exception(f"Task failed: {e}")
            return False

    def download_files(self, url, subfolder, file_name):
        """下载文件"""
        logger.info(f"Downloading file from {url} to {subfolder}/{file_name}")
        base_dir = os.path.join(bpy.context.scene.render.filepath, "mesh_artificer")
        download_dir = os.path.join(base_dir, subfolder)
        os.makedirs(download_dir, exist_ok=True)
        file_path = os.path.join(download_dir, file_name)
        client = XClient('')
        try:
            response = client.get(url, stream=True)
            response.raise_for_status()
        except RequestException as e:
            logger.exception(f"Error downloading file from {url}: {e}")
            return None
        try:
            with open(file_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            return file_path
        except Exception as e:
            logger.exception(f"Error parsing response file from {url}: {e}")
            return None
