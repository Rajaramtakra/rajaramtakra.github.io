process.env.NODE_ENV = "test";
process.env.DATABASE_URL ??= "postgresql://erp_user:erp_password@localhost:5432/school_erp_test?schema=public";
process.env.JWT_ACCESS_SECRET ??= "test-access-secret-min-32-characters-long";
process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret-min-32-characters-long";
