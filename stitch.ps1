Add-Type -AssemblyName System.Drawing
$sourcesDir = "D:\Gail 2.1\working_copy\playcanvas-app\assets\environments\backdrops\sources"
$outputPath = "D:\Gail 2.1\working_copy\playcanvas-app\assets\environments\backdrops\mountain_lake_stitched_panorama.jpg"
$files = Get-ChildItem -Path $sourcesDir -Filter *.jpg | Sort-Object Name
$overlap = 120
$targetHeight = 1200
$images = New-Object System.Collections.Generic.List[System.Drawing.Bitmap]
$totalWidth = 0
foreach ($f in $files) {
    $img = [System.Drawing.Image]::FromFile($f.FullName)
    $aspect = $img.Width / $img.Height
    $newW = [int]($targetHeight * $aspect)
    $resizing = New-Object System.Drawing.Bitmap($newW, $targetHeight)
    $g = [System.Drawing.Graphics]::FromImage($resizing)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, $newW, $targetHeight)
    $g.Dispose()
    $img.Dispose()
    $images.Add($resizing)
    if ($images.Count -eq 1) { $totalWidth += $newW } else { $totalWidth += ($newW - $overlap) }
    Write-Host "$($f.Name): $($resizing.Width)x$($resizing.Height)"
}
$panorama = New-Object System.Drawing.Bitmap($totalWidth, $targetHeight)
$pg = [System.Drawing.Graphics]::FromImage($panorama)
$currentX = 0
for ($i = 0; $i -lt $images.Count; $i++) {
    $img = $images[$i]
    if ($i -eq 0) {
        $pg.DrawImage($img, 0, 0)
        $currentX = $img.Width
    } else {
        $startX = $currentX - $overlap
        $pg.DrawImage($img, $startX, 0)
        $currentX = $startX + $img.Width
    }
}
$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.FormatDescription -eq "JPEG" }
$params = New-Object System.Drawing.Imaging.EncoderParameters(1)
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 95)
$panorama.Save($outputPath, $encoder, $params)
$pg.Dispose()
$panorama.Dispose()
foreach($img in $images) { $img.Dispose() }
$finalFile = Get-Item $outputPath
Write-Host "Panorama: $($finalFile.FullName)"
Write-Host "Dimensions: $($totalWidth)x$($targetHeight)"
Write-Host "Size: $($finalFile.Length) bytes"
