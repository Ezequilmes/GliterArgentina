@echo off
set SDKROOT=C:\Users\Admin\.bubblewrap\android_sdk
"%SDKROOT%\tools\bin\sdkmanager.bat" --licenses --sdk_root="%SDKROOT%" < y.txt
