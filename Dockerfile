# ----------------------------
# Stage 1: Android 빌드용 환경
# ----------------------------
    FROM ubuntu:22.04 AS builder

    ENV DEBIAN_FRONTEND=noninteractive \
        ANDROID_HOME=/opt/android \
        NODE_VERSION=20.18 \
        NDK_VERSION=27.1.12297006 \
        CMAKE_VERSION=3.22.1 \
        ANDROID_BUILD_VERSION=35 \
        ANDROID_TOOLS_VERSION=35.0.0 \
        JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 \
        PATH=$PATH:/opt/android/cmdline-tools/latest/bin:/opt/android/platform-tools
    
    # 필수 패키지 설치
    RUN apt-get update && apt-get install -y \
      curl unzip git build-essential python3 openjdk-17-jdk-headless zip \
      ninja-build libgl1 && apt-get clean
    
    # Node.js + yarn 설치
    RUN curl -L https://raw.githubusercontent.com/tj/n/master/bin/n -o n && \
        bash n $NODE_VERSION && rm n && npm install -g yarn
    
    # Android SDK 설치
    RUN curl -sS https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -o sdk.zip && \
        mkdir -p ${ANDROID_HOME}/cmdline-tools && \
        unzip -q sdk.zip -d ${ANDROID_HOME}/cmdline-tools && \
        mv ${ANDROID_HOME}/cmdline-tools/cmdline-tools ${ANDROID_HOME}/cmdline-tools/latest && \
        yes | sdkmanager --licenses && \
        yes | sdkmanager "platform-tools" "platforms;android-${ANDROID_BUILD_VERSION}" \
        "build-tools;${ANDROID_TOOLS_VERSION}" "ndk;${NDK_VERSION}" "cmake;${CMAKE_VERSION}"
    
    WORKDIR /app
    
    # 의존성 설치
    COPY package.json ./
    RUN yarn install
    
    # 전체 코드 복사 및 APK 빌드
    COPY . .
    RUN yarn react-native bundle --platform android --dev false --entry-file index.js \
      --bundle-output android/app/src/main/assets/index.android.bundle \
      --assets-dest android/app/src/main/res && \
      cd android && ./gradlew assembleDebug --no-daemon
    
    # ----------------------------
    # Stage 2: APK 배포 컨테이너
    # ----------------------------
    FROM nginx:alpine
    COPY --from=builder /app/android/app/build/outputs/apk/debug/app-debug.apk /usr/share/nginx/html/app-debug.apk
    
    CMD ["nginx", "-g", "daemon off;"]
    