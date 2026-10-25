Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead("e:\_UNS\Sistemas Operativos 2026\Examenes\Parcial 2025.docx")
$entry = $zip.GetEntry("word/document.xml")
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$content = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()
$text = $content -replace '<[^>]+>', ' '
$text -replace '\s+', ' ' | Out-File -FilePath "e:\_UNS\Sistemas Operativos 2026\Examenes\parcial_2025_text.txt" -Encoding utf8
Write-Host "Done"
