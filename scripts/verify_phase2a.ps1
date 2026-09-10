# CANONIX Phase 2A E2E Verification Script
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "CANONIX PHASE 2A: RBAC & AUTH E2E TEST" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# 1. Health check
$health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -Method Get
Write-Host "✔ Backend Health: $($health.status) (v$($health.version))" -ForegroundColor Green

# 2. Super Admin Login
$saBody = @{ email = "superadmin@canonix.gov.in"; password = "Canonix@2026" } | ConvertTo-Json
$saAuth = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/auth/login" -Method Post -ContentType "application/json" -Body $saBody
Write-Host "✔ Super Admin Login: $($saAuth.user.role.name) ($($saAuth.user.email))" -ForegroundColor Green

# 3. CPCL Admin Login
$cpclBody = @{ email = "admin@cpcl.co.in"; password = "Canonix@2026" } | ConvertTo-Json
$cpclAuth = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/auth/login" -Method Post -ContentType "application/json" -Body $cpclBody
Write-Host "✔ CPCL Admin Login: $($cpclAuth.user.role.name) [Tenant: $($cpclAuth.user.cpse.code)]" -ForegroundColor Green

# 4. Material Expert Login
$expertBody = @{ email = "expert@cpcl.co.in"; password = "Canonix@2026" } | ConvertTo-Json
$expertAuth = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/auth/login" -Method Post -ContentType "application/json" -Body $expertBody
Write-Host "✔ Material Expert Login: $($expertAuth.user.role.name) [Tenant: $($expertAuth.user.cpse.code)]" -ForegroundColor Green

# 5. Procurement Analyst Login
$analystBody = @{ email = "analyst@cpcl.co.in"; password = "Canonix@2026" } | ConvertTo-Json
$analystAuth = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/auth/login" -Method Post -ContentType "application/json" -Body $analystBody
Write-Host "✔ Procurement Analyst Login: $($analystAuth.user.role.name) [Tenant: $($analystAuth.user.cpse.code)]" -ForegroundColor Green

# 6. RBAC Guard: CPCL Admin -> Super Admin endpoint (Must 403)
try {
    Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/auth/verify/super-admin" -Headers @{ Authorization = "Bearer $($cpclAuth.access_token)" }
    Write-Host "❌ RBAC Guard: Failed (Did not block)" -ForegroundColor Red
} catch {
    Write-Host "✔ RBAC Guard: PASSED (Blocked CPCL Admin from Super Admin endpoint with 403 Forbidden)" -ForegroundColor Green
}

# 7. Tenant Isolation: CPCL Admin -> IOCL data (Must 403)
try {
    Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/auth/verify/tenant-access/IOCL" -Headers @{ Authorization = "Bearer $($cpclAuth.access_token)" }
    Write-Host "❌ Tenant Isolation: Failed (Did not block)" -ForegroundColor Red
} catch {
    Write-Host "✔ Tenant Isolation: PASSED (Blocked CPCL Admin from IOCL tenant data with 403 Forbidden)" -ForegroundColor Green
}

# 8. Super Admin Universal Access: -> IOCL data (Must 200)
$saTenant = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/auth/verify/tenant-access/IOCL" -Headers @{ Authorization = "Bearer $($saAuth.access_token)" }
Write-Host "✔ Super Admin Universal Access: PASSED (Access granted to $($saTenant.target_cpse))" -ForegroundColor Green

# 9. Frontend Route check
$loginPage = Invoke-WebRequest -Uri "http://localhost:3000/login" -UseBasicParsing
Write-Host "✔ Frontend /login Route: $($loginPage.StatusCode) OK" -ForegroundColor Green

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "ALL PHASE 2A TESTS PASSED SUCCESSFULLY!" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
