FROM apache/spark:3.5.3

USER root

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3.9 \
        python3.9-dev \
        python3.9-distutils \
        build-essential \
        curl && \
    rm -rf /var/lib/apt/lists/*

# Install pip
RUN curl https://bootstrap.pypa.io/pip/3.9/get-pip.py -o get-pip.py && \
    python3.9 get-pip.py && \
    rm get-pip.py

# Set Python for Spark
ENV PYSPARK_PYTHON=/usr/bin/python3.9
ENV PYSPARK_DRIVER_PYTHON=/usr/bin/python3.9

USER spark