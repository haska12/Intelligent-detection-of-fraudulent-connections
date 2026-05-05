@echo off
cd docker_configuration

:: Arrêt et nettoyage des volumes
docker compose down -v

:: Lancement des conteneurs
docker-compose up -d

:: Attente optionnelle (laisse au NameNode le temps de démarrer)
echo Attente du demarrage de HDFS...
timeout /t 30

:: Création des répertoires (sans -it)
docker exec namenode hdfs dfs -mkdir -p /data
docker exec namenode hdfs dfs -mkdir -p /data/unsw
docker exec namenode hdfs dfs -mkdir -p /ml
cd ..
:: Copie des fichiers CSV
docker exec namenode bash -c "hdfs dfs -put /home/spark_data/dataset/*.csv /data/unsw/"

echo Configuration terminee.
pause

