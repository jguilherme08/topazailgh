@echo off
cd /d "c:\Users\User\OneDrive\Documentos\topaz"
echo Removendo package-lock.json...
if exist package-lock.json del package-lock.json
echo Limpando npm cache...
call npm cache clean --force
echo Instalando dependências...
call npm install
echo Pronto!
pause
