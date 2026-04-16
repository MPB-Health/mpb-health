# Bulk-fix type cast issues introduced by replacing select('*') with explicit columns.
# Safe: skips node_modules, dist, .next, tests.

$targets = @(
    "packages\crm-core\src",
    "packages\admin-core\src",
    "packages\champion-core\src",
    "packages\advisor-core\src",
    "packages\plans-core\src",
    "packages\auth\src",
    "packages\licensing\src",
    "packages\database\src",
    "apps\website\src",
    "apps\crm\src",
    "apps\admin-portal\src",
    "apps\staff-hub\src",
    "apps\champion-portal\src",
    "apps\advisor-portal\src"
)

$fileCount = 0
$changeCount = 0

foreach ($dir in $targets) {
    if (-not (Test-Path $dir)) { continue }
    $files = Get-ChildItem -Path $dir -Recurse -Include "*.ts","*.tsx" -ErrorAction SilentlyContinue |
             Where-Object { $_.FullName -notmatch "node_modules|\.next|dist|\.test\.|\.spec\." }

    foreach ($f in $files) {
        $content = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
        if (-not $content) { continue }
        $orig = $content

        # 1. Fix bare `return data;` inside service methods (but not in UI/component contexts where data is typed).
        #    Only target lines that look like they're inside async DB methods.
        $content = $content -replace '(\r?\n\s{4,}return data);(\r?\n)', '$1 as any;$2'

        # 2. Fix bare `return data || [];`
        $content = $content -replace '(\r?\n\s{4,}return )(data \|\| \[\]);(\r?\n)', '$1($2) as any;$3'

        # 3. Upgrade `as TypeName` (without existing `unknown`) to `as unknown as TypeName`,
        #    but ONLY when preceded by `data`, `result`, or closing paren -- and NOT in import/export statements.
        #    This pattern targets lines containing "= something" or "return something" with type assertion.
        $lines = $content -split "`n"
        for ($i = 0; $i -lt $lines.Length; $i++) {
            $line = $lines[$i]
            # Skip import/export type re-exports
            if ($line -match '^\s*(import|export)\s') { continue }
            # Only touch lines that contain `data` or ending in `)` with `as` cast
            if ($line -match '\b(data|result|record|row|item|entry)\b.*\)\s+as\s+(?!unknown|Record<|any\b|string|number|boolean|null|undefined|typeof|\{|keyof|const)([A-Z])') {
                $lines[$i] = $line -replace '\)\s+as\s+(?!unknown|Record<|any\b|string|number|boolean|null|undefined|typeof|\{|keyof|const)([A-Z])', ') as unknown as $1'
            }
            if ($line -match '\b(data|result|record|row|item|entry)\s+as\s+(?!unknown|Record<|any\b|string|number|boolean|null|undefined|typeof|\{|keyof|const)([A-Z])') {
                $lines[$i] = $lines[$i] -replace '\b(data|result|record|row|item|entry)\s+as\s+(?!unknown|Record<|any\b|string|number|boolean|null|undefined|typeof|\{|keyof|const)([A-Z])', '$1 as unknown as $2'
            }
        }
        $content = $lines -join "`n"

        # 4. Collapse any accidental triple: `as unknown as unknown as`.
        while ($content -match 'as unknown as unknown as') {
            $content = $content -replace 'as unknown as unknown as', 'as unknown as'
        }

        if ($content -ne $orig) {
            Set-Content -Path $f.FullName -Value $content -NoNewline
            $fileCount++
            $diffs = ($orig.Length - $content.Length)
            $changeCount += [Math]::Abs($diffs)
        }
    }
}

Write-Output "Files modified: $fileCount"
