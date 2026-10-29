@echo off
echo Starting backend on port 8081...
cd /d "%~dp0backend"
call mvn spring-boot:run -DskipTests
