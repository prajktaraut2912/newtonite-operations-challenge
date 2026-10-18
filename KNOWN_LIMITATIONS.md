# Known Limitations

## 1. Database Integration

The PostgreSQL schema and connection module have been created, but the current API still uses in-memory arrays. Data is lost when the server restarts. Persistent database integration remains necessary.

## 2. Authentication

The current API uses a temporary demo-user header. This is not secure authentication and must not be used in production. A proper login system and secure session management are required.

## 3. Authorization

The API contains basic role and team checks, but the permission model is incomplete. Team membership and permissions must be loaded from the database and enforced consistently for every operation.

## 4. Concurrent Updates

Version checks are implemented in the in-memory API. Database-backed conditional updates and transactions are needed to enforce concurrency rules reliably across multiple server instances.

## 5. Duplicate Requests

The current API tracks idempotency keys in memory. Keys are not persistent, and concurrent duplicate requests are not handled safely across multiple server instances.

## 6. Testing

Automated API tests have been added, but they have not yet been executed. Test results must be verified in a Node.js environment.

## 7. Deployment

The application has not yet been deployed or verified in a hosted environment. Database configuration, runtime setup, and deployment checks remain outstanding.

## 8. Search and Scale

The current API filters in-memory data. Database-backed pagination, search, and query optimization are required for larger datasets.

## Next Steps

Prioritize database integration, secure authentication, consistent authorization, reliable concurrent updates, automated test execution, and deployment verification.
