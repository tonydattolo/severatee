import { pgTable, pgSchema, pgEnum, varchar, uuid, text, timestamp, uniqueIndex, index, foreignKey, jsonb, unique, integer, boolean, smallint, json, bigserial, inet, bigint } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const auth = pgSchema("auth");
export const storage = pgSchema("storage");
export const aal_levelInAuth = auth.enum("aal_level", ['aal1', 'aal2', 'aal3'])
export const code_challenge_methodInAuth = auth.enum("code_challenge_method", ['s256', 'plain'])
export const factor_statusInAuth = auth.enum("factor_status", ['unverified', 'verified'])
export const factor_typeInAuth = auth.enum("factor_type", ['totp', 'webauthn'])
export const one_time_token_typeInAuth = auth.enum("one_time_token_type", ['confirmation_token', 'reauthentication_token', 'recovery_token', 'email_change_token_new', 'email_change_token_current', 'phone_change_token'])
export const key_status = pgEnum("key_status", ['default', 'valid', 'invalid', 'expired'])
export const key_type = pgEnum("key_type", ['aead-ietf', 'aead-det', 'hmacsha512', 'hmacsha256', 'auth', 'shorthash', 'generichash', 'kdf', 'secretbox', 'secretstream', 'stream_xchacha20'])
export const action = pgEnum("action", ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'ERROR'])
export const equality_op = pgEnum("equality_op", ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'in'])


export const schema_migrationsInAuth = auth.table("schema_migrations", {
	version: varchar("version", { length: 255 }).primaryKey().notNull(),
});

export const instancesInAuth = auth.table("instances", {
	id: uuid("id").primaryKey().notNull(),
	uuid: uuid("uuid"),
	raw_base_config: text("raw_base_config"),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
});

export const objectsInStorage = storage.table("objects", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	bucket_id: text("bucket_id").references(() => bucketsInStorage.id),
	name: text("name"),
	owner: uuid("owner"),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	last_accessed_at: timestamp("last_accessed_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	metadata: jsonb("metadata"),
	path_tokens: text("path_tokens").array(),
	version: text("version"),
	owner_id: text("owner_id"),
},
	(table) => {
		return {
			bucketid_objname: uniqueIndex("bucketid_objname").using("btree", table.bucket_id, table.name),
			idx_objects_bucket_id_name: index("idx_objects_bucket_id_name").using("btree", table.bucket_id, table.name),
			name_prefix_search: index("name_prefix_search").using("btree", table.name),
		}
	});

export const migrationsInStorage = storage.table("migrations", {
	id: integer("id").primaryKey().notNull(),
	name: varchar("name", { length: 100 }).notNull(),
	hash: varchar("hash", { length: 40 }).notNull(),
	executed_at: timestamp("executed_at", { mode: 'string' }).defaultNow(),
},
	(table) => {
		return {
			migrations_name_key: unique("migrations_name_key").on(table.name),
		}
	});

export const usersInAuth = auth.table("users", {
	instance_id: uuid("instance_id"),
	id: uuid("id").primaryKey().notNull(),
	aud: varchar("aud", { length: 255 }),
	role: varchar("role", { length: 255 }),
	email: varchar("email", { length: 255 }),
	encrypted_password: varchar("encrypted_password", { length: 255 }),
	email_confirmed_at: timestamp("email_confirmed_at", { withTimezone: true, mode: 'string' }),
	invited_at: timestamp("invited_at", { withTimezone: true, mode: 'string' }),
	confirmation_token: varchar("confirmation_token", { length: 255 }),
	confirmation_sent_at: timestamp("confirmation_sent_at", { withTimezone: true, mode: 'string' }),
	recovery_token: varchar("recovery_token", { length: 255 }),
	recovery_sent_at: timestamp("recovery_sent_at", { withTimezone: true, mode: 'string' }),
	email_change_token_new: varchar("email_change_token_new", { length: 255 }),
	email_change: varchar("email_change", { length: 255 }),
	email_change_sent_at: timestamp("email_change_sent_at", { withTimezone: true, mode: 'string' }),
	last_sign_in_at: timestamp("last_sign_in_at", { withTimezone: true, mode: 'string' }),
	raw_app_meta_data: jsonb("raw_app_meta_data"),
	raw_user_meta_data: jsonb("raw_user_meta_data"),
	is_super_admin: boolean("is_super_admin"),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	phone: text("phone").default(''),
	phone_confirmed_at: timestamp("phone_confirmed_at", { withTimezone: true, mode: 'string' }),
	phone_change: text("phone_change").default(''),
	phone_change_token: varchar("phone_change_token", { length: 255 }).default(''),
	phone_change_sent_at: timestamp("phone_change_sent_at", { withTimezone: true, mode: 'string' }),
	confirmed_at: timestamp("confirmed_at", { withTimezone: true, mode: 'string' }),
	email_change_token_current: varchar("email_change_token_current", { length: 255 }).default(''),
	email_change_confirm_status: smallint("email_change_confirm_status").default(0),
	banned_until: timestamp("banned_until", { withTimezone: true, mode: 'string' }),
	reauthentication_token: varchar("reauthentication_token", { length: 255 }).default(''),
	reauthentication_sent_at: timestamp("reauthentication_sent_at", { withTimezone: true, mode: 'string' }),
	is_sso_user: boolean("is_sso_user").default(false).notNull(),
	deleted_at: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
	is_anonymous: boolean("is_anonymous").default(false).notNull(),
},
	(table) => {
		return {
			confirmation_token_idx: uniqueIndex("confirmation_token_idx").using("btree", table.confirmation_token).where(sql`((confirmation_token)::text !~ '^[0-9 ]*$'::text)`),
			email_change_token_current_idx: uniqueIndex("email_change_token_current_idx").using("btree", table.email_change_token_current).where(sql`((email_change_token_current)::text !~ '^[0-9 ]*$'::text)`),
			email_change_token_new_idx: uniqueIndex("email_change_token_new_idx").using("btree", table.email_change_token_new).where(sql`((email_change_token_new)::text !~ '^[0-9 ]*$'::text)`),
			reauthentication_token_idx: uniqueIndex("reauthentication_token_idx").using("btree", table.reauthentication_token).where(sql`((reauthentication_token)::text !~ '^[0-9 ]*$'::text)`),
			recovery_token_idx: uniqueIndex("recovery_token_idx").using("btree", table.recovery_token).where(sql`((recovery_token)::text !~ '^[0-9 ]*$'::text)`),
			email_partial_key: uniqueIndex("users_email_partial_key").using("btree", table.email).where(sql`(is_sso_user = false)`),
			instance_id_email_idx: index("users_instance_id_email_idx").using("btree", sql`instance_id`, sql`null`),
			instance_id_idx: index("users_instance_id_idx").using("btree", table.instance_id),
			is_anonymous_idx: index("users_is_anonymous_idx").using("btree", table.is_anonymous),
			users_phone_key: unique("users_phone_key").on(table.phone),
		}
	});

export const audit_log_entriesInAuth = auth.table("audit_log_entries", {
	instance_id: uuid("instance_id"),
	id: uuid("id").primaryKey().notNull(),
	payload: json("payload"),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	ip_address: varchar("ip_address", { length: 64 }).default('').notNull(),
},
	(table) => {
		return {
			audit_logs_instance_id_idx: index("audit_logs_instance_id_idx").using("btree", table.instance_id),
		}
	});

export const saml_relay_statesInAuth = auth.table("saml_relay_states", {
	id: uuid("id").primaryKey().notNull(),
	sso_provider_id: uuid("sso_provider_id").notNull().references(() => sso_providersInAuth.id, { onDelete: "cascade" }),
	request_id: text("request_id").notNull(),
	for_email: text("for_email"),
	redirect_to: text("redirect_to"),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	flow_state_id: uuid("flow_state_id").references(() => flow_stateInAuth.id, { onDelete: "cascade" }),
},
	(table) => {
		return {
			created_at_idx: index("saml_relay_states_created_at_idx").using("btree", table.created_at),
			for_email_idx: index("saml_relay_states_for_email_idx").using("btree", table.for_email),
			sso_provider_id_idx: index("saml_relay_states_sso_provider_id_idx").using("btree", table.sso_provider_id),
		}
	});

export const refresh_tokensInAuth = auth.table("refresh_tokens", {
	instance_id: uuid("instance_id"),
	id: bigserial("id", { mode: "bigint" }).primaryKey().notNull(),
	token: varchar("token", { length: 255 }),
	user_id: varchar("user_id", { length: 255 }),
	revoked: boolean("revoked"),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	parent: varchar("parent", { length: 255 }),
	session_id: uuid("session_id").references(() => sessionsInAuth.id, { onDelete: "cascade" }),
},
	(table) => {
		return {
			instance_id_idx: index("refresh_tokens_instance_id_idx").using("btree", table.instance_id),
			instance_id_user_id_idx: index("refresh_tokens_instance_id_user_id_idx").using("btree", table.instance_id, table.user_id),
			parent_idx: index("refresh_tokens_parent_idx").using("btree", table.parent),
			session_id_revoked_idx: index("refresh_tokens_session_id_revoked_idx").using("btree", table.session_id, table.revoked),
			updated_at_idx: index("refresh_tokens_updated_at_idx").using("btree", table.updated_at),
			refresh_tokens_token_unique: unique("refresh_tokens_token_unique").on(table.token),
		}
	});

export const mfa_factorsInAuth = auth.table("mfa_factors", {
	id: uuid("id").primaryKey().notNull(),
	user_id: uuid("user_id").notNull().references(() => usersInAuth.id, { onDelete: "cascade" }),
	friendly_name: text("friendly_name"),
	// factor_type: factor_type("factor_type").notNull(),
	// status: factor_status("status").notNull(),
	factor_type: text("factor_type").notNull(),
	status: text("status").notNull(),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
	secret: text("secret"),
},
	(table) => {
		return {
			factor_id_created_at_idx: index("factor_id_created_at_idx").using("btree", table.user_id, table.created_at),
			user_friendly_name_unique: uniqueIndex("mfa_factors_user_friendly_name_unique").using("btree", table.friendly_name, table.user_id).where(sql`(TRIM(BOTH FROM friendly_name) <> ''::text)`),
			user_id_idx: index("mfa_factors_user_id_idx").using("btree", table.user_id),
		}
	});

export const sessionsInAuth = auth.table("sessions", {
	id: uuid("id").primaryKey().notNull(),
	user_id: uuid("user_id").notNull().references(() => usersInAuth.id, { onDelete: "cascade" }),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	factor_id: uuid("factor_id"),
	aal: text("aal"),
	// aal: aal_level("aal"),
	not_after: timestamp("not_after", { withTimezone: true, mode: 'string' }),
	refreshed_at: timestamp("refreshed_at", { mode: 'string' }),
	user_agent: text("user_agent"),
	ip: inet("ip"),
	tag: text("tag"),
},
	(table) => {
		return {
			not_after_idx: index("sessions_not_after_idx").using("btree", table.not_after),
			user_id_idx: index("sessions_user_id_idx").using("btree", table.user_id),
			user_id_created_at_idx: index("user_id_created_at_idx").using("btree", table.user_id, table.created_at),
		}
	});

export const sso_providersInAuth = auth.table("sso_providers", {
	id: uuid("id").primaryKey().notNull(),
	resource_id: text("resource_id"),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
},
	(table) => {
		return {
			resource_id_idx: uniqueIndex("sso_providers_resource_id_idx").using("btree", sql`lower(resource_id)`),
		}
	});

export const sso_domainsInAuth = auth.table("sso_domains", {
	id: uuid("id").primaryKey().notNull(),
	sso_provider_id: uuid("sso_provider_id").notNull().references(() => sso_providersInAuth.id, { onDelete: "cascade" }),
	domain: text("domain").notNull(),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
},
	(table) => {
		return {
			domain_idx: uniqueIndex("sso_domains_domain_idx").using("btree", sql`lower(domain)`),
			sso_provider_id_idx: index("sso_domains_sso_provider_id_idx").using("btree", table.sso_provider_id),
		}
	});

export const mfa_challengesInAuth = auth.table("mfa_challenges", {
	id: uuid("id").primaryKey().notNull(),
	factor_id: uuid("factor_id").notNull().references(() => mfa_factorsInAuth.id, { onDelete: "cascade" }),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	verified_at: timestamp("verified_at", { withTimezone: true, mode: 'string' }),
	ip_address: inet("ip_address").notNull(),
},
	(table) => {
		return {
			mfa_challenge_created_at_idx: index("mfa_challenge_created_at_idx").using("btree", table.created_at),
		}
	});

export const mfa_amr_claimsInAuth = auth.table("mfa_amr_claims", {
	session_id: uuid("session_id").notNull().references(() => sessionsInAuth.id, { onDelete: "cascade" }),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).notNull(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).notNull(),
	authentication_method: text("authentication_method").notNull(),
	id: uuid("id").primaryKey().notNull(),
},
	(table) => {
		return {
			mfa_amr_claims_session_id_authentication_method_pkey: unique("mfa_amr_claims_session_id_authentication_method_pkey").on(table.session_id, table.authentication_method),
		}
	});

export const saml_providersInAuth = auth.table("saml_providers", {
	id: uuid("id").primaryKey().notNull(),
	sso_provider_id: uuid("sso_provider_id").notNull().references(() => sso_providersInAuth.id, { onDelete: "cascade" }),
	entity_id: text("entity_id").notNull(),
	metadata_xml: text("metadata_xml").notNull(),
	metadata_url: text("metadata_url"),
	attribute_mapping: jsonb("attribute_mapping"),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	name_id_format: text("name_id_format"),
},
	(table) => {
		return {
			sso_provider_id_idx: index("saml_providers_sso_provider_id_idx").using("btree", table.sso_provider_id),
			saml_providers_entity_id_key: unique("saml_providers_entity_id_key").on(table.entity_id),
		}
	});

export const flow_stateInAuth = auth.table("flow_state", {
	id: uuid("id").primaryKey().notNull(),
	user_id: uuid("user_id"),
	auth_code: text("auth_code").notNull(),
	// code_challenge_method: code_challenge_method("code_challenge_method").notNull(),
	code_challenge_method: text("code_challenge_method").notNull(),
	code_challenge: text("code_challenge").notNull(),
	provider_type: text("provider_type").notNull(),
	provider_access_token: text("provider_access_token"),
	provider_refresh_token: text("provider_refresh_token"),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	authentication_method: text("authentication_method").notNull(),
	auth_code_issued_at: timestamp("auth_code_issued_at", { withTimezone: true, mode: 'string' }),
},
	(table) => {
		return {
			created_at_idx: index("flow_state_created_at_idx").using("btree", table.created_at),
			idx_auth_code: index("idx_auth_code").using("btree", table.auth_code),
			idx_user_id_auth_method: index("idx_user_id_auth_method").using("btree", table.user_id, table.authentication_method),
		}
	});

export const identitiesInAuth = auth.table("identities", {
	provider_id: text("provider_id").notNull(),
	user_id: uuid("user_id").notNull().references(() => usersInAuth.id, { onDelete: "cascade" }),
	identity_data: jsonb("identity_data").notNull(),
	provider: text("provider").notNull(),
	last_sign_in_at: timestamp("last_sign_in_at", { withTimezone: true, mode: 'string' }),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	email: text("email"),
	id: uuid("id").defaultRandom().primaryKey().notNull(),
},
	(table) => {
		return {
			email_idx: index("identities_email_idx").using("btree", table.email),
			user_id_idx: index("identities_user_id_idx").using("btree", table.user_id),
			identities_provider_id_provider_unique: unique("identities_provider_id_provider_unique").on(table.provider_id, table.provider),
		}
	});

export const one_time_tokensInAuth = auth.table("one_time_tokens", {
	id: uuid("id").primaryKey().notNull(),
	user_id: uuid("user_id").notNull().references(() => usersInAuth.id, { onDelete: "cascade" }),
	// token_type: one_time_token_type("token_type").notNull(),
	token_type: text("token_type").notNull(),
	token_hash: text("token_hash").notNull(),
	relates_to: text("relates_to").notNull(),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updated_at: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
},
	(table) => {
		return {
			relates_to_hash_idx: index("one_time_tokens_relates_to_hash_idx").using("hash", table.relates_to),
			token_hash_hash_idx: index("one_time_tokens_token_hash_hash_idx").using("hash", table.token_hash),
			user_id_token_type_key: uniqueIndex("one_time_tokens_user_id_token_type_key").using("btree", table.user_id, table.token_type),
		}
	});

export const bucketsInStorage = storage.table("buckets", {
	id: text("id").primaryKey().notNull(),
	name: text("name").notNull(),
	owner: uuid("owner"),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	public: boolean("public").default(false),
	avif_autodetection: boolean("avif_autodetection").default(false),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	file_size_limit: bigint("file_size_limit", { mode: "number" }),
	allowed_mime_types: text("allowed_mime_types").array(),
	owner_id: text("owner_id"),
},
	(table) => {
		return {
			bname: uniqueIndex("bname").using("btree", table.name),
		}
	});

export const s3_multipart_uploadsInStorage = storage.table("s3_multipart_uploads", {
	id: text("id").primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	in_progress_size: bigint("in_progress_size", { mode: "number" }).default(0).notNull(),
	upload_signature: text("upload_signature").notNull(),
	bucket_id: text("bucket_id").notNull().references(() => bucketsInStorage.id),
	key: text("key").notNull(),
	version: text("version").notNull(),
	owner_id: text("owner_id"),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
},
	(table) => {
		return {
			idx_multipart_uploads_list: index("idx_multipart_uploads_list").using("btree", table.bucket_id, table.key, table.created_at),
		}
	});

export const s3_multipart_uploads_partsInStorage = storage.table("s3_multipart_uploads_parts", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	upload_id: text("upload_id").notNull().references(() => s3_multipart_uploadsInStorage.id, { onDelete: "cascade" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	size: bigint("size", { mode: "number" }).default(0).notNull(),
	part_number: integer("part_number").notNull(),
	bucket_id: text("bucket_id").notNull().references(() => bucketsInStorage.id),
	key: text("key").notNull(),
	etag: text("etag").notNull(),
	owner_id: text("owner_id"),
	version: text("version").notNull(),
	created_at: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});