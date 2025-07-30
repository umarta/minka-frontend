#!/usr/bin/env groovy

def getEnvironmentConfig(environment) {
    def configs = [
        'staging': [
            api_url: 'https://api-staging.kame.co.id',
            node_resources: [
                limits: [memory: '1Gi', cpu: '500m'],
                requests: [memory: '512Mi', cpu: '250m']
            ],
            docker_resources: [
                limits: [memory: '1Gi', cpu: '500m'],
                requests: [memory: '512Mi', cpu: '250m']
            ],
            helm_resources: [
                limits: [memory: '256Mi', cpu: '200m'],
                requests: [memory: '128Mi', cpu: '100m']
            ],
            git_resources: [
                limits: [memory: '128Mi', cpu: '100m'],
                requests: [memory: '64Mi', cpu: '50m']
            ],
            deployment_timeout: '5m',
            require_approval: false,
            tag_latest: false,
            namespace: 'kame-staging'
        ],
        'rc': [
            api_url: 'https://api-rc.kame.co.id',
            node_resources: [
                limits: [memory: '1Gi', cpu: '500m'],
                requests: [memory: '512Mi', cpu: '250m']
            ],
            docker_resources: [
                limits: [memory: '1Gi', cpu: '500m'],
                requests: [memory: '512Mi', cpu: '250m']
            ],
            helm_resources: [
                limits: [memory: '256Mi', cpu: '200m'],
                requests: [memory: '128Mi', cpu: '100m']
            ],
            git_resources: [
                limits: [memory: '128Mi', cpu: '100m'],
                requests: [memory: '64Mi', cpu: '50m']
            ],
            deployment_timeout: '5m',
            require_approval: false,
            tag_latest: false,
            namespace: 'kame-rc'
        ],
        'production': [
            api_url: 'https://api.kame.co.id',
            node_resources: [
                limits: [memory: '1Gi', cpu: '500m'],
                requests: [memory: '512Mi', cpu: '250m']
            ],
            docker_resources: [
                limits: [memory: '1Gi', cpu: '500m'],
                requests: [memory: '512Mi', cpu: '250m']
            ],
            helm_resources: [
                limits: [memory: '256Mi', cpu: '200m'],
                requests: [memory: '128Mi', cpu: '100m']
            ],
            git_resources: [
                limits: [memory: '128Mi', cpu: '100m'],
                requests: [memory: '64Mi', cpu: '50m']
            ],
            deployment_timeout: '10m',
            require_approval: true,
            tag_latest: true,
            namespace: 'kame-prod',
            gcp_instance: [
                instance_name: 'instance-1',
                user: 'ubuntu',
                zone: 'asia-southeast2-a',
                port: '3006',
                domain: 'kame.co.id'
            ]
        ]
    ]
    return configs[environment]
}

pipeline {
    agent {
        kubernetes {
            yaml """
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: jenkins-agent
spec:
  serviceAccountName: helm
  nodeSelector:
    node-role.kubernetes.io/master: "true"
  containers:
  - name: node
    image: node:18-alpine
    command: ['cat']
    tty: true
    resources:
      limits:
        memory: "${getEnvironmentConfig(params.ENVIRONMENT).node_resources.limits.memory}"
        cpu: "${getEnvironmentConfig(params.ENVIRONMENT).node_resources.limits.cpu}"
      requests:
        memory: "${getEnvironmentConfig(params.ENVIRONMENT).node_resources.requests.memory}"
        cpu: "${getEnvironmentConfig(params.ENVIRONMENT).node_resources.requests.cpu}"
    volumeMounts:
    - name: yarn-cache
      mountPath: /usr/local/share/.cache/yarn
  - name: dind
    image: docker:24.0-dind
    securityContext:
      privileged: true
    args: ["--host=tcp://0.0.0.0:2375"]
    env:
      - name: DOCKER_TLS_CERTDIR
        value: ""
    resources:
      limits:
        memory: "${getEnvironmentConfig(params.ENVIRONMENT).docker_resources.limits.memory}"
        cpu: "${getEnvironmentConfig(params.ENVIRONMENT).docker_resources.limits.cpu}"
      requests:
        memory: "${getEnvironmentConfig(params.ENVIRONMENT).docker_resources.requests.memory}"
        cpu: "${getEnvironmentConfig(params.ENVIRONMENT).docker_resources.requests.cpu}"
  - name: docker
    image: docker:24.0
    command: ["sleep", "infinity"]
    env:
      - name: DOCKER_HOST
        value: tcp://localhost:2375
    resources:
      limits:
        memory: "${getEnvironmentConfig(params.ENVIRONMENT).docker_resources.limits.memory}"
        cpu: "${getEnvironmentConfig(params.ENVIRONMENT).docker_resources.limits.cpu}"
      requests:
        memory: "${getEnvironmentConfig(params.ENVIRONMENT).docker_resources.requests.memory}"
        cpu: "${getEnvironmentConfig(params.ENVIRONMENT).docker_resources.requests.cpu}"
    volumeMounts:
    - name: gcp-key
      mountPath: /gcp
      readOnly: true
  - name: kubectl
    image: google/cloud-sdk:alpine
    command: ['cat']
    tty: true
    resources:
      limits:
        memory: "256Mi"
        cpu: "200m"
      requests:
        memory: "128Mi"
        cpu: "100m"
    volumeMounts:
    - name: gcp-key
      mountPath: /gcp
      readOnly: true
  - name: helm
    image: alpine/helm:latest
    command: ['cat']
    tty: true
    resources:
      limits:
        memory: "${getEnvironmentConfig(params.ENVIRONMENT).helm_resources.limits.memory}"
        cpu: "${getEnvironmentConfig(params.ENVIRONMENT).helm_resources.limits.cpu}"
      requests:
        memory: "${getEnvironmentConfig(params.ENVIRONMENT).helm_resources.requests.memory}"
        cpu: "${getEnvironmentConfig(params.ENVIRONMENT).helm_resources.requests.cpu}"
  - name: git
    image: alpine/git:latest
    command: ['cat']
    tty: true
    resources:
      limits:
        memory: "${getEnvironmentConfig(params.ENVIRONMENT).git_resources.limits.memory}"
        cpu: "${getEnvironmentConfig(params.ENVIRONMENT).git_resources.requests.cpu}"
      requests:
        memory: "${getEnvironmentConfig(params.ENVIRONMENT).git_resources.requests.memory}"
        cpu: "${getEnvironmentConfig(params.ENVIRONMENT).git_resources.requests.cpu}"
  volumes:
  - name: yarn-cache
    emptyDir: {}
  - name: gcp-key
    secret:
      secretName: gcp-service-account-key
"""
        }
    }
    
    parameters {
        choice(name: 'ENVIRONMENT', choices: ['staging', 'rc', 'production'], description: 'Select deployment environment')
    }
    
    environment {
        GCR_PROJECT = 'production-411607'
        IMAGE_NAME = 'minka-frontend'
        WORKSPACE = "${WORKSPACE}"
        HELM_CHART_PATH = "./config/helm/minka-frontend"
        BRANCH_NAME = "${env.BRANCH_NAME}"
        HELM_RELEASE = "minka-frontend-${params.ENVIRONMENT}"
        VALUES_FILE = "${HELM_CHART_PATH}/values/values-${params.ENVIRONMENT}.yaml"
        API_URL = "${getEnvironmentConfig(params.ENVIRONMENT).api_url}"
        DOCKER_BUILDKIT = '1'
        NODE_ENV = 'production'
        NEXT_TELEMETRY_DISABLED = '1'
    }
    
    stages {
        stage('Setup GCP Authentication') {
      steps {
                timeout(time: 2, unit: 'MINUTES') {
                    container('docker') {
        script {
                            // Wait for Docker daemon to be ready with timeout
                            sh '''
                                set -e
                                echo "Waiting for Docker daemon to be ready..."
                                for i in {1..20}; do
                                  if docker info > /dev/null 2>&1; then
                                    echo "✅ Docker daemon is ready"
                                    break
                                  fi
                                  echo "Waiting for Docker daemon... ($i/20)"
                                  sleep 3
                                  if [ $i -eq 20 ]; then
                                    echo "❌ Docker daemon failed to start within timeout"
                                    exit 1
                                  fi
                                done
                            '''
                            
                            // Login to GCR using service account key
                            sh '''
                                echo "Authenticating with GCR..."
                                cat /gcp/service-account.json | docker login -u _json_key --password-stdin https://gcr.io
                                echo "✅ Successfully authenticated with GCR"
                            '''
            }
          }
        }
      }
    }

        stage('Clone Repository') {
            steps {
                timeout(time: 3, unit: 'MINUTES') {
                    container('git') {
                        sh "echo '📥 Cloning repository from GitHub using credentials...'"
                        withCredentials([usernamePassword(credentialsId: 'umarta-git-credentials', usernameVariable: 'GIT_USERNAME', passwordVariable: 'GIT_PASSWORD')]) {
                            sh '''
                                set -e
                                echo "Configuring git credentials..."
                                git config --global credential.helper store
                                echo "https://${GIT_USERNAME}:${GIT_PASSWORD}@github.com" > ~/.git-credentials
                                
                                echo "Cloning k3s repository..."
                                git clone --depth 1 https://github.com/umarta/k3s.git k3s-repo
                                rm -f ~/.git-credentials
                                
                                echo "✅ Repository cloned successfully"
                            '''
                        }
                        sh '''
                            echo "📁 Verifying cloned repository structure..."
                            ls -la k3s-repo
                            
                            echo "🔍 Checking Helm chart directory..."
                            if [ -d "k3s-repo/config/helm/minka-frontend" ]; then
                                echo "✅ Helm directory found"
                                ls -la k3s-repo/config/helm/minka-frontend
                            else
                                echo "❌ Helm directory not found"
                                find k3s-repo -name "helm" -type d || echo "No helm directories found"
                            fi
                        '''
                    }
                }
            }
        }

        stage('Prepare Environment File') {
            steps {
                timeout(time: 3, unit: 'MINUTES') {
                    container('kubectl') {
                    script {
                        def secretName = "minka-frontend-${params.ENVIRONMENT}-secrets"
                        def namespace = getEnvironmentConfig(params.ENVIRONMENT).namespace
                        
                        echo "Installing kubectl and jq..."
                        sh '''
                            apk add --no-cache kubectl jq
                            kubectl version --client
                            jq --version
                        '''
                        
                        // Check if secret exists and create .env file
                        def secretExists = sh(
                            script: "kubectl get secret ${secretName} -n ${namespace} > /dev/null 2>&1",
                            returnStatus: true
                        ) == 0
                        
                        if (secretExists) {
                            echo "Creating .env file from Kubernetes Secret: ${secretName} in namespace ${namespace}"
                            sh """
                                # Extract secrets using jq
                                kubectl get secret ${secretName} -n ${namespace} -o json | \
                                jq -r '.data | to_entries[] | .key + "=" + (.value | @base64d)' > .env.production
                                
                                echo "✅ Environment variables loaded from secret"
                                echo "📄 .env file contents:"
                                cat .env.production
                            """
                        } else {
                            echo "WARNING: Secret ${secretName} not found in namespace ${namespace}"
                            echo "Creating default .env file"
                            sh '''
                            cat > .env.production << EOF
# API Configuration
NEXT_PUBLIC_API_URL=https://staging-minka-api.kame.co.id/api
NEXT_PUBLIC_WS_URL=wss://staging-minka-api.kame.co.id/api/ws/connect

# Media Configuration
NEXT_PUBLIC_MEDIA_URL=http://localhost:8080/media

# Authentication
NEXTAUTH_SECRET=your-super-secret-jwt-key
NEXTAUTH_URL=http://localhost:3000

# App Configuration
NEXT_PUBLIC_APP_NAME=Kame
NEXT_PUBLIC_APP_VERSION=1.0.0

# Development
NODE_ENV=development
EOF
                            '''
                            echo "✅ Default .env file created"
                        }
                        
                        // Verify .env file was created
                        sh 'ls -la .env.production && echo "📄 .env file size: $(wc -l < .env.production) lines"'
                        
                        // Fix permissions for .env file
                        sh 'chmod 644 .env.production && chown cloudsdk:cloudsdk .env.production || true'
                        sh 'ls -al'
                    }
                }
                }
            }
        }

        stage('Build & Push Docker Image') {
      steps {
                container('docker') {
          script {
                        def imageTag = env.GIT_COMMIT.take(7)
                        def imageName = "gcr.io/${GCR_PROJECT}/${IMAGE_NAME}"
                        def envConfig = getEnvironmentConfig(params.ENVIRONMENT)

              sh """
                            docker build -t ${imageName}:${imageTag} .
                            docker push ${imageName}:${imageTag}
                        """
                        
                        // if (envConfig.tag_latest) {
                            sh """
                                docker tag ${imageName}:${imageTag} ${imageName}:${params.ENVIRONMENT}
                                docker push ${imageName}:${params.ENVIRONMENT}
                            """
                        // }
                        
                        // Clean up .env file for security
                        sh 'rm -f .env.production'
                        
                        echo "✅ Successfully built and pushed image: ${imageName}:${imageTag}"
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    def envConfig = getEnvironmentConfig(params.ENVIRONMENT)
                    def namespace = envConfig.namespace
                    def imageTag = env.GIT_COMMIT.take(7)
                    def valuesFile = "./k3s-repo/config/helm/minka-frontend/values/values-${params.ENVIRONMENT}.yaml"
                    def helmRelease = "minka-frontend-${params.ENVIRONMENT}"
                    echo "🔄 Deploying ${params.ENVIRONMENT} to Kubernetes"
                    container('helm') {
                        sh """
                            echo "🔄 Deploying ${helmRelease} to Kubernetes namespace: ${namespace}"
                            
                            helm upgrade --install ${helmRelease} ./k3s-repo/config/helm/minka-frontend \
                                -f ${valuesFile} \
                                --set image.tag=${params.ENVIRONMENT} \
                                --set image.repository=gcr.io/${GCR_PROJECT}/${IMAGE_NAME} \
                                --set imagePullSecrets.create=true \
                                --set namespace.create=false \
                                --set networkPolicy.enabled=false \
                                --set autoscaling.enabled=false \
                                --set ingress.enabled=false \
                                --set config.secrets.create=true \
                                --namespace=${namespace} \
                                --timeout ${envConfig.deployment_timeout}
                            
                            echo "✅ Kubernetes deployment completed successfully"
                        """
                    }
                }
            }
        }

        stage('Cleanup') {
            steps {
                container('git') {
                    sh "echo 'Cleaning up cloned repository...'"
                    sh "rm -rf k3s-repo || echo 'Repository cleanup failed, but continuing'"
                    sh "echo 'Cleanup completed'"
                }
            }
        }
    }
    
  post {
        success {
            script {
                
                echo """
                    ✅ ${params.ENVIRONMENT} Deployment to Kubernetes successful!
                    • Application: ${IMAGE_NAME}
                    • Environment: ${params.ENVIRONMENT}
                    • Platform: Kubernetes
                    • Namespace: ${getEnvironmentConfig(params.ENVIRONMENT).namespace}
                    • Image: gcr.io/${GCR_PROJECT}/${IMAGE_NAME}:${env.GIT_COMMIT.take(7)}

                    Monitor the deployment:
                    kubectl get pods -n ${getEnvironmentConfig(params.ENVIRONMENT).namespace} -w
                """
            }
        }
        failure {
            script {
                echo """
                    ❌ ${params.ENVIRONMENT} Deployment to Kubernetes failed!
                    • Application: ${IMAGE_NAME}
                    • Environment: ${params.ENVIRONMENT}
                    • Platform: Kubernetes
                    • Namespace: ${getEnvironmentConfig(params.ENVIRONMENT).namespace}
                    • Image: gcr.io/${GCR_PROJECT}/${IMAGE_NAME}:${env.GIT_COMMIT.take(7)}

                    Troubleshooting commands:
                    kubectl get pods -n ${getEnvironmentConfig(params.ENVIRONMENT).namespace}
                    kubectl describe pods -l app.kubernetes.io/name=${IMAGE_NAME} -n ${getEnvironmentConfig(params.ENVIRONMENT).namespace}
                    kubectl logs -l app.kubernetes.io/name=${IMAGE_NAME} -n ${getEnvironmentConfig(params.ENVIRONMENT).namespace}

                    Rollback command:
                    helm rollback minka-frontend-${params.ENVIRONMENT} -n ${getEnvironmentConfig(params.ENVIRONMENT).namespace}
                """
            }
        }
        always {
            cleanWs()
        }
    }
}

