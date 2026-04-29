# Genesis 8 Automation

This is the automated part of the Genesis 8 pipeline.

## What Is Automated

- Blender-side morph validation against a preset
- Blender-side base avatar FBX export
- Texture collection into a Unity-friendly folder
- Unity-side blendshape lookup by canonical Genesis 8 names and aliases

## Blender Morph Preset

The canonical morph preset is:

- [genesis8_morph_preset.json](/e:/Gail/blender_scripts/genesis8_morph_preset.json)

It defines:

- required expression morphs
- recommended visemes
- alias names that often differ between Genesis 8 exports

## Blender Export Script

The export script is:

- [export_genesis8_unity.py](/e:/Gail/blender_scripts/export_genesis8_unity.py)

Run it from Blender after importing your DAZ FBX and finalizing one runtime rig.

Example:

```powershell
blender.exe "E:\path\to\your_avatar.blend" --python "E:\Gail\blender_scripts\export_genesis8_unity.py" -- --armature "Armature" --meshes "Genesis8Female,Hair,Top,Lashes" --face-mesh "Genesis8Female" --output-fbx "E:\Gail\rebuild\unity\Assets\Avatar\Models\base_avatar.fbx" --copy-textures-dir "E:\Gail\rebuild\unity\Assets\Avatar\Models\Textures"
```

Validation only:

```powershell
blender.exe "E:\path\to\your_avatar.blend" --python "E:\Gail\blender_scripts\export_genesis8_unity.py" -- --armature "Armature" --meshes "Genesis8Female,Hair,Top,Lashes" --face-mesh "Genesis8Female" --output-fbx "E:\temp\ignore.fbx" --validate-only
```

## What The Script Checks

- armature exists
- every export mesh exists
- every export mesh is bound to the armature
- the face mesh contains the required shape keys
- referenced textures can be found on disk

If required morphs are missing, the export fails.

## Unity Driver

The Unity driver is:

- [Genesis8BlendshapeDriver.cs](/e:/Gail/rebuild/unity/Assets/Avatar/Scripts/Genesis8BlendshapeDriver.cs)
- [Genesis8BlendshapeValidator.cs](/e:/Gail/rebuild/unity/Assets/Avatar/Scripts/Genesis8BlendshapeValidator.cs)

Attach it to your avatar root or face object, then assign the face `SkinnedMeshRenderer`.

It resolves canonical names like:

- `Blink Left`
- `Blink Right`
- `Jaw Open`
- `Mouth Open`
- `Mouth Smile Simple Left`
- `Mouth Smile Simple Right`
- `AA`
- `EE`
- `OH`
- `M`
- `BP`

Add the validator temporarily during import testing so Unity logs a quick expected-morph checklist when the scene starts.

## Manual Step That Still Matters

You still need to do one correct DAZ export:

- Genesis 8 figure
- Morphs enabled
- only the morph set you want
- no animation on the base export

That DAZ export is the least automatable part.
