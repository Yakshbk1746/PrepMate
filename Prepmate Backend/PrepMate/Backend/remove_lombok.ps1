$dir = "c:\Users\Mayank\OneDrive\Desktop\Collage Projects\Prep Mate\Project\test\Backend\src\main\java"
Get-ChildItem -Path $dir -Recurse -Filter *.java | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    
    if ($content -match "lombok") {
        # Remove import
        $content = $content -replace '(?m)^import lombok\..*?;\r?\n', ''
        
        # Check for @RequiredArgsConstructor
        if ($content -match "@RequiredArgsConstructor") {
            $content = $content -replace '(?m)^@RequiredArgsConstructor\r?\n', ''
            
            # Find class name
            if ($content -match "public class (\w+)") {
                $className = $matches[1]
                
                # Find all private final fields
                $fields = [regex]::Matches($content, 'private final ([a-zA-Z0-9<>_]+) ([a-zA-Z0-9_]+);')
                
                if ($fields.Count -gt 0) {
                    $constructorArgs = @()
                    $constructorAssignments = @()
                    
                    foreach ($field in $fields) {
                        $type = $field.Groups[1].Value
                        $name = $field.Groups[2].Value
                        $constructorArgs += "$type $name"
                        $constructorAssignments += "        this.$name = $name;"
                    }
                    
                    $constructorArgsStr = $constructorArgs -join ", "
                    $constructorAssignmentsStr = $constructorAssignments -join "`r`n"
                    
                    $constructor = "`r`n    public $className($constructorArgsStr) {`r`n$constructorAssignmentsStr`r`n    }`r`n"
                    
                    # Insert constructor after the last field
                    $lastFieldMatch = $fields[$fields.Count - 1].Value
                    $content = $content -replace [regex]::Escape($lastFieldMatch), "$lastFieldMatch$constructor"
                }
            }
        }
        
        Set-Content -Path $_.FullName -Value $content -Encoding UTF8
    }
}
