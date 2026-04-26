const systemLexicon = {

    // ===============================================
    // CLOUD & INFRASTRUCTURE (IaaS, PaaS, Orchestration)
    // ===============================================
    'CloudAndInfra': [
        'VirtualMachine', 'Container', 'Kubernetes', 'Orchestration', 'LoadBalancer', 
        'AutoScaling', 'Region', 'AvailabilityZone', 'Networking', 'VPC', 'Subnet', 
        'IngressController', 'Gateway', 'ServiceMesh', 'NetworkingPolicy', 'BastionHost', 
        'Terraform', 'CloudFormation', 'Idempotency', 'Networking', 'API_Gateway',
        'CDN', 'EdgeCaching', 'DNS_Resolution', 'HybridCloud', 'Serverless', 
        'Lambda', 'ContainerRegistry', 'ResourceGroup', 'Elasticity', 'Isolation',
        'Ephemeral', 'EphemeralStorage', 'IP_Address', 'DNS_Record', 'DNS_TTL',
        'BastionHost', 'VPN', 'DirectConnect', 'NetworkACL', 'FirewallRule',
        'TrafficShaping', 'Geofencing', 'Failover', 'Redundancy', 'MultiRegion'
    ],

    // ===============================================
    // DATA & PERSISTENCE (Database Theory, Data Flow)
    // ===============================================
    'DataPersistence': [
        'Schema', 'SchemaMigration', 'SchemaValidation', 'NoSQL', 'Relational', 
        'ACID', 'BASE', 'EventuallyConsistent', 'Sharding', 'Replication', 'MasterSlave', 
        'LeaderFollower', 'Transactions', 'DistributedTransactions', 'EventSourcing', 
        'CommandQuerySeparation', 'CQRS', 'WriteModel', 'ReadModel', 'DataLake', 
        'DataWarehouse', 'ETL', 'ELT', 'Streaming', 'MessageQueue', 'Topic', 'Partition', 
        'KeyValueStore', 'GraphDatabase', 'PolyglotPersistence', 'Indexing', 'MaterializedView',
        'Throughput', 'Latency', 'Payload', 'PayloadSchema', 'BatchProcessing', 
        'StreamingData', 'CDC', 'ChangeDataCapture', 'Idempotency', 'WriteConflict',
        'TransactionIsolation', 'Deadlock', 'LockingMechanism', 'ConsistencyModel'
    ],

    // ===============================================
    // ARCHITECTURE & DESIGN PATTERNS
    // ===============================================
    'ArchitecturePatterns': [
        'Microservices', 'Monolith', 'ServiceOrientedArchitecture', 'SOA', 'EventDrivenArchitecture', 
        'MessagePassing', 'Saga', 'Idempotent', 'ResiliencePattern', 'CircuitBreaker', 
        'RetryMechanism', 'Bulkhead', 'ObserverPattern', 'Facade', 'GatewayPattern', 
        'Mediator', 'AntiCorruptionLayer', 'AdapterPattern', 'CQRS', 'StateMachine', 
        'Workflow', 'Temporal', 'Command', 'Query', 'Aggregate', 'BoundedContext', 
        'DomainDrivenDesign', 'DDD', 'ContextMapping', 'Polyglot', 'Asynchronous', 
        'Synchronous', 'VerticalSlicing', 'HorizontalScaling', 'EventBus', 'Broker', 
        'Decoupling', 'Coupling', 'BoundedContext', 'FallbackMechanism'
    ],

    // ===============================================
    // DEVOPS, CI/CD & PROCESS AUTOMATION
    // ===============================================
    'DevOpsAndCI_CD': [
        'CI_Pipeline', 'CD_Pipeline', 'IaC', 'InfrastructureAsCode', 'GitOps', 'Gitflow', 
        'BlueGreenDeployment', 'CanaryRelease', 'SmokeTest', 'StressTesting', 'SoakTest', 
        'Observability', 'Monitoring', 'Logging', 'Tracing', 'Alerting', 'Dashboard', 
        'Metrics', 'SLO', 'SLI', 'SRE', 'GoldenSignal', 'AutomatedTesting', 'Linting', 
        'Profiling', 'VersionControl', 'BuildSystem', 'ArtifactRegistry', 'Rollback', 
        'DriftDetection', 'ComplianceCheck', 'PolicyAsCode', 'Pipelines', 'WorkflowEngine',
        'ImmutableArtifact', 'ChaosEngineering', 'ObservabilityStack', 'Telemetry', 'DriftControl'
    ],

    // ===============================================
    // SECURITY & NETWORKING
    // ===============================================
    'SecurityAndNetwork': [
        'OAuth2', 'OIDC', 'JWT', 'BearerToken', 'RoleBasedAccessControl', 'RBAC', 
        'AttributeBasedAccessControl', 'ABAC', 'ZeroTrust', 'MutualTLS', 'mTLS', 
        'EncryptionAtRest', 'EncryptionInTransit', 'Hashing', 'Salt', 'CSRF', 'XSS', 
        'InjectionFlaw', 'OWASP', 'WAF', 'DDoS', 'RateLimiting', 'APIKey', 
        'SecretManagement', 'SecretsVault', 'KeyRotation', 'LeastPrivilege', 'AuditTrail', 
        'TLSHandshake', 'CipherSuite', 'CertificatePinning', 'GatewaySecurity', 
        'CrossOriginResourceSharing', 'CORS', 'Firewall', 'IntrusionDetectionSystem', 
        'NetworkSegmentation', 'EndpointSecurity', 'PostureManagement', 'Compliance'
    ],

    // ===============================================
    // CORE PROGRAMMING & CONCEPTS
    // ===============================================
    'CoreConcepts': [
        'Concurrency', 'Parallelism', 'Thread', 'Process', 'Semaphore', 'Mutex', 
        'RaceCondition', 'Deadlock', 'Atomicity', 'Immutability', 'SideEffect', 
        'SideEffectFree', 'Callback', 'Promise', 'AsyncAwait', 'Observable', 
        'Observer', 'Generics', 'Polymorphism', 'Abstraction', 'Encapsulation', 
        'Middleware', 'Decorator', 'DependencyInjection', 'InversionOfControl', 
        'Throughput', 'Latency', 'Jitter', 'Backpressure', 'TimeWindow', 'Grain', 
        'TuringCompleteness', 'AlgorithmComplexity', 'BigONotation', 'Recursion', 
        'Memoization', 'MemoizationCache', 'MemoizationKey', 'Stateful', 'Stateless'
    ]
};

function getRandomWord() {
    // 1. Collect all the arrays (the values) from the system object
    const allArrays = Object.values(systemLexicon);
    
    // 2. Combine all the inner arrays into one massive array of words
    // Using flat() method to flatten the array of arrays
    const allTerms = Array.from(allArrays).flat();

    // 3. Check if any terms exist before proceeding
    if (allTerms.length === 0) {
        return "Error: No terms found in the system object.";
    }

    // 4. Generate a random index based on the total length of all terms
    const randomIndex = Math.floor(Math.random() * allTerms.length);
    
    // 5. Return the term at that random index
    console.log(allTerms[randomIndex]); // Log the selected term for debugging
    return allTerms[randomIndex];
}

