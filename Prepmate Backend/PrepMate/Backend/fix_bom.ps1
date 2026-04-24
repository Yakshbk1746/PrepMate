$dir = "c:\Users\Mayank\OneDrive\Desktop\Collage Projects\Prep Mate\Project\test\Backend\src\main\java"
Get-ChildItem -Path $dir -Recurse -Filter *.java | ForEach-Object {
    $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        Write-Host "Fixing BOM in $($_.Name)"
        $content = [System.IO.File]::ReadAllText($_.FullName)
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($_.FullName, $content, $utf8NoBom)
    }
}
