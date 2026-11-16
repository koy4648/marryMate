FROM eclipse-temurin:21-jdk AS builder
WORKDIR /workspace
COPY gradle gradle
COPY gradlew build.gradle settings.gradle ./
COPY src src
RUN ./gradlew bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --uid 10001 marrymate
COPY --from=builder /workspace/build/libs/*.jar app.jar
USER marrymate
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]

