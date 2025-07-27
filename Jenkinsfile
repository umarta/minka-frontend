#!/usr/bin/env groovy

def getEnvironmentConfig(environment) {
    def configs = [
        'staging': [
            api_url: 'https://api-staging.minka.co.id',
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
        'production': [
            api_url: 'https://api.minka.co.id',
            node_resources: [
                limits: [memory: '1Gi', cpu: '1000m'],
                requests: [memory: '512Mi', cpu: '500m']
            ],
            docker_resources: [
                limits: [memory: '2Gi', cpu: '1000m'],
                requests: [memory: '1Gi', cpu: '500m']
            ],
            helm_resources: [
                limits: [memory: '512Mi', cpu: '300m'],
                requests: [memory: '256Mi', cpu: '150m']
            ],
            git_resources: [
                limits: [memory: '128Mi', cpu: '100m'],
                requests: [memory: '64Mi', cpu: '50m']
            ],
            deployment_timeout: '10m',
            require_approval: true,
            tag_latest: true,
            namespace: 'kame-prod'
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
    image: node:20-alpine
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
    image: alpine:latest
    command: ['cat']
    tty: true
    resources:
      limits:
        memory: "256Mi"
        cpu: "200m"
      requests:
        memory: "128Mi"
        cpu: "100m"
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
        choice(name: 'ENVIRONMENT', choices: ['staging', 'production'], description: 'Select deployment environment')
    }
    
    environment {
        GCR_PROJECT = 'production-411607'
        IMAGE_NAME = 'minka-frontend'
        WORKSPACE = "${WORKSPACE}"
        HELM_CHART_PATH = "${WORKSPACE}/k3s/config/helm/minka-frontend"
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

        // stage('Build') {
        //     steps {
        //         container('node') {
        //             script {
        //                 // Set NODE_OPTIONS to increase memory limit
        //                 // sh 'export NODE_OPTIONS="--max-old-space-size=3072"'
        //                 // sh 'npm ci'
        //                 // sh 'npm run build'
        //             }
        //         }
        //     }
        // }

        stage('Docker Build and Push') {
            steps {
                timeout(time: 15, unit: 'MINUTES') {
                    container('docker') {
                        script {
                        def imageTag = env.GIT_COMMIT.take(7)
                        def imageName = "gcr.io/${GCR_PROJECT}/${IMAGE_NAME}"
                        def envConfig = getEnvironmentConfig(params.ENVIRONMENT)
                        
                        // Add debug information
                        sh """
                            echo "=== DEBUG: Environment Information ==="
                            echo "Docker version:"
                            docker version
                            echo "\nDocker info:"
                            docker info
                            echo "\nDisk space:"
                            df -h
                            echo "\nNetwork connectivity test:"
                            ping -c 3 dl-cdn.alpinelinux.org || echo "Ping failed but continuing"
                            echo "\nDNS resolution test:"
                            nslookup dl-cdn.alpinelinux.org || echo "DNS lookup failed but continuing"
                            echo "=== END DEBUG INFO ===\n"
                            
                            echo "Building Docker image: ${imageName}:${imageTag}"
                            # Build with DOCKER_BUILDKIT enabled for better performance and detailed logs
                            DOCKER_BUILDKIT=1 docker build \
                              --progress=plain \
                              --no-cache \
                              --network=host \
                              -t ${imageName}:${imageTag} . 2>&1 | tee docker_build.log
                            
                            echo "\n=== Docker build completed, checking log for common issues ==="
                            grep -i "error|warning|failed|timeout" docker_build.log || echo "No common error patterns found"
                        """
                        
                        // Push Docker image with retry mechanism
                        sh """
                            MAX_RETRIES=3
                            RETRY_COUNT=0
                            PUSH_SUCCESS=false

                            while [ \$RETRY_COUNT -lt \$MAX_RETRIES ] && [ "\$PUSH_SUCCESS" != "true" ]; do
                                echo "Pushing Docker image to ${imageName}:${imageTag} (Attempt \$((\$RETRY_COUNT + 1))/\$MAX_RETRIES)"
                                if docker push ${imageName}:${imageTag}; then
                                    PUSH_SUCCESS=true
                                    echo "✅ Push successful!"
                                else
                                    RETRY_COUNT=\$((\$RETRY_COUNT + 1))
                                    if [ \$RETRY_COUNT -lt \$MAX_RETRIES ]; then
                                        echo "Push failed. Retrying in 10 seconds..."
                                        sleep 10
                                    else
                                        echo "❌ Push failed after \$MAX_RETRIES attempts."
                                        exit 1
                                    fi
                                fi
                            done
                        """
                        
                        // Tag as latest if configured
                        if (envConfig.tag_latest) {
                            sh """
                                docker tag ${imageName}:${imageTag} ${imageName}:latest
                                docker push ${imageName}:latest
                            """
                        }
                        
                        // Clean up .env file for security
                        sh 'rm -f .env'
                        
                        echo "✅ Successfully built and pushed image: ${imageName}:${imageTag}"
                    }
                }
            }
        
        }

        stage('Approval') {
            when {
                expression { return getEnvironmentConfig(params.ENVIRONMENT).require_approval }
            }
            steps {
                timeout(time: 24, unit: 'HOURS') {
                    input message: "Deploy to ${params.ENVIRONMENT}?", ok: "Yes"
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                container('helm') {
                    script {
                        def envConfig = getEnvironmentConfig(params.ENVIRONMENT)
                        def namespace = envConfig.namespace
                        def imageTag = env.GIT_COMMIT.take(7)
                        def imageName = "gcr.io/${GCR_PROJECT}/${IMAGE_NAME}"
                        
                        // Check if namespace exists
                        def namespaceExists = sh(script: "kubectl get namespace ${namespace} -o name 2>/dev/null || true", returnStdout: true).trim()
                        
                        if (namespaceExists) {
                            echo "Namespace ${namespace} exists"
                            
                            // Check if namespace has Helm ownership label
                            def hasHelmLabel = sh(script: "kubectl get namespace ${namespace} -o jsonpath='{.metadata.labels.\"app\\.kubernetes\\.io/managed-by\"}' 2>/dev/null || true", returnStdout: true).trim()
                            
                            if (hasHelmLabel != 'Helm') {
                                echo "Namespace ${namespace} exists but doesn't have Helm ownership label. Deleting..."
                                sh "kubectl delete namespace ${namespace}"
                                
                                // Wait for namespace to be fully deleted
                                sh """
                                MAX_RETRIES=30
                                RETRY_COUNT=0
                                DELETED=false

                                while [ \$RETRY_COUNT -lt \$MAX_RETRIES ] && [ "\$DELETED" != "true" ]; do
                                    echo "Waiting for namespace to be deleted (Attempt \$((\$RETRY_COUNT + 1))/\$MAX_RETRIES)"
                                    if ! kubectl get namespace ${namespace} &> /dev/null; then
                                        DELETED=true
                                        echo "✅ Namespace deleted successfully"
                                    else
                                        RETRY_COUNT=\$((\$RETRY_COUNT + 1))
                                        echo "Namespace still exists. Waiting 5 seconds..."
                                        sleep 5
                                        if [ \$RETRY_COUNT -eq \$MAX_RETRIES ]; then
                                            echo "❌ Failed to delete namespace after \$MAX_RETRIES attempts."
                                            exit 1
                                        fi
                                    fi
                                done
                                """
                            }
                        } else {
                            echo "Namespace ${namespace} does not exist. It will be created by Helm."
                        }
                        
                        // Deploy with Helm
                        sh """
                        helm upgrade --install ${HELM_RELEASE} ./k3s-repo/config/helm/minka-frontend \
                            -f ${VALUES_FILE} \
                            --set image.tag=${imageTag} \
                            --set image.repository=${imageName} \
                            --set imagePullSecrets.create=false \
                            --set imagePullSecrets.name=gcr-registry-secret \
                            --set namespace.create=true \
                            --set namespace.name=${namespace} \
                            --set ingress.enabled=false \
                            --set config.env.NEXT_PUBLIC_API_URL=${API_URL} \
                            --set existingSecretName=minka-frontend-${params.ENVIRONMENT}-secrets \
                            --namespace=${namespace} \
                            --create-namespace \
                            --timeout=${envConfig.deployment_timeout} \
                            --wait \
                            --atomic
                        """
                        
                        // Create GCR registry secret in namespace
                        sh """
                        kubectl create secret docker-registry gcr-registry-secret \
                            --docker-server=https://gcr.io \
                            --docker-username=_json_key \
                            --docker-password=\$(cat /gcp/service-account.json) \
                            --docker-email=umarta@example.com \
                            -n ${namespace} \
                            --dry-run=client -o yaml | kubectl apply -f -
                        """
                        
                        // Verify deployment
                        sh """
                        kubectl rollout status deployment/${HELM_RELEASE} -n ${namespace} --timeout=${envConfig.deployment_timeout}
                        
                        echo "Deployment status:"
                        kubectl get pods -l app.kubernetes.io/instance=${HELM_RELEASE} -n ${namespace}
                        echo "✅ Successfully deployed ${HELM_RELEASE} to ${namespace}"
                        """
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo "Deployment to ${params.ENVIRONMENT} completed successfully!"
        }
        failure {
            echo "Deployment to ${params.ENVIRONMENT} failed!"
        }
        always {
            echo "Cleaning up workspace..."
            cleanWs()
        }
    }
}
