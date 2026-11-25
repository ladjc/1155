# Compila o jar sem depender de Maven instalado na maquina anfitria.
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml .
RUN mvn --batch-mode dependency:go-offline

COPY src ./src
RUN mvn --batch-mode --no-transfer-progress -DskipTests package
RUN mv target/*.jar /app/app.jar

# A imagem final contem apenas o Java necessario para executar a aplicacao.
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/app.jar ./app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
