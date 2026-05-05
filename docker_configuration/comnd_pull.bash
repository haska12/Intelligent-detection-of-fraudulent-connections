#!/bin/bash

docker pull apache/kafka:4.1.1
docker pull bde2020/hadoop-namenode:2.0.0-hadoop3.2.1-java8
docker pull bde2020/hadoop-datanode:2.0.0-hadoop3.2.1-java8
docker pull zookeeper:3.8.0
docker pull apache/spark:4.0.2

docker compose up -d
