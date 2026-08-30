@echo off
chcp 65001 >nul
title 法智通 - 准备上传到 GitHub
cd /d "%~dp0"

echo ============================================================
echo   准备上传项目到 GitHub（方案A - Render 部署前置步骤）
echo ============================================================
echo.
echo [1/3] 删除不需要上传的大文件夹（节省上传时间）
echo       node_modules / temp / .hbuilderx / dist
echo.
if exist node_modules ( echo     正在删除 node_modules... & rmdir /s /q node_modules & echo     node_modules 已删除 )
if exist temp         ( echo     正在删除 temp...         & rmdir /s /q temp         & echo     temp 已删除 )
if exist .hbuilderx   ( echo     正在删除 .hbuilderx...   & rmdir /s /q .hbuilderx   & echo     .hbuilderx 已删除 )
if exist dist         ( echo     正在删除 dist...         & rmdir /s /q dist         & echo     dist 已删除（构建由 Render 自动完成）)
echo.
echo [2/3] 删除 .env.local（里面有 API Key，不能公开）
if exist .env.local ( del /a /f .env.local & echo     .env.local 已删除 )
if exist .env       ( del /a /f .env       & echo     .env       已删除 )
echo.
echo [3/3] 最终文件夹大小（请确认不要超过 GitHub 1GB 限制）
echo.
powershell -Command "Get-ChildItem -Recurse -File | Measure-Object -Property Length -Sum | Select @{Name='文件数';Expression={.Count}}, @{Name='总大小MB';Expression={[math]::Round(.Sum/1MB,2)}}"
echo.
echo ============================================================
echo   OK！现在可以上传本文件夹到 GitHub 了：
echo   1. 打开 https://github.com/new  创建仓库，名 fazhitong-student
echo   2. 点 "...or upload an existing file"
echo   3. 把整个 "%~dp0" 拖进去
echo   4. 点 Commit changes
echo   5. 看 Render部署-5步傻瓜手册.txt 的第3~5步
echo ============================================================
echo.
pause
