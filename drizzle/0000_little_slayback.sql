CREATE TYPE "public"."zip_type" AS ENUM('STANDARD', 'PO BOX', 'UNIQUE', 'MILITARY');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "article_to_category" (
	"article_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"is_main" boolean DEFAULT false NOT NULL,
	CONSTRAINT "article_to_category_article_id_category_id_pk" PRIMARY KEY("article_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_id" text,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text,
	"content" text,
	"image" text,
	"meta_title" text,
	"meta_description" text,
	"meta_keyword" text,
	"meta_h1" text,
	"status" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"viewed" integer DEFAULT 0 NOT NULL,
	"noindex" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "blog_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"meta_title" text,
	"meta_description" text,
	"meta_keyword" text,
	"meta_h1" text,
	"image" text,
	"top" boolean DEFAULT false NOT NULL,
	"column" integer DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" boolean DEFAULT true NOT NULL,
	"noindex" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "blog_category_path" (
	"category_id" integer NOT NULL,
	"path_id" integer NOT NULL,
	"level" integer NOT NULL,
	CONSTRAINT "blog_category_path_category_id_path_id_pk" PRIMARY KEY("category_id","path_id")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"parent_id" integer,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"meta_title" text,
	"meta_description" text,
	"meta_keyword" text,
	"meta_h1" text,
	"image" text,
	"top" boolean DEFAULT false NOT NULL,
	"column" integer DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" boolean DEFAULT true NOT NULL,
	"noindex" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "category_path" (
	"category_id" integer NOT NULL,
	"path_id" integer NOT NULL,
	"level" integer NOT NULL,
	CONSTRAINT "category_path_category_id_path_id_pk" PRIMARY KEY("category_id","path_id")
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"entity_type" text DEFAULT 'company' NOT NULL,
	"legal_name" text NOT NULL,
	"dba_name" text,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"meta_title" text,
	"meta_description" text,
	"meta_keyword" text,
	"meta_h1" text,
	"image" text,
	"phone" text,
	"email" text,
	"website" text,
	"ein" text,
	"business_structure" text,
	"year_founded" integer,
	"employees_count" integer,
	"is_insured" boolean DEFAULT false NOT NULL,
	"is_bonded" boolean DEFAULT false NOT NULL,
	"is_licensed" boolean DEFAULT false NOT NULL,
	"address_line1" text,
	"address_line2" text,
	"city" text,
	"state" text,
	"zip" text,
	"country" text DEFAULT 'US' NOT NULL,
	"latitude" text,
	"longitude" text,
	"status" boolean DEFAULT false NOT NULL,
	"moderation_status" text DEFAULT 'pending' NOT NULL,
	"moderation_note" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"viewed" integer DEFAULT 0 NOT NULL,
	"noindex" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	CONSTRAINT "companies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "company_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"type" text NOT NULL,
	"file_key" text NOT NULL,
	"original_name" text NOT NULL,
	"content_type" text NOT NULL,
	"file_size" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"reviewed_by" text
);
--> statement-breakpoint
CREATE TABLE "company_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"image" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_to_category" (
	"company_id" integer NOT NULL,
	"category_id" integer NOT NULL,
	"is_main" boolean DEFAULT false NOT NULL,
	CONSTRAINT "company_to_category_company_id_category_id_pk" PRIMARY KEY("company_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "geo_usa" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"zip" char(5) NOT NULL,
	"city" text,
	"city_ascii" text,
	"alternate_cities" text,
	"slug" text,
	"state_id" char(2),
	"state_name" text,
	"county_fips" char(5),
	"county_name" text,
	"city_lat" numeric(10, 6),
	"city_lng" numeric(10, 6),
	"population" integer,
	"density" numeric(8, 2),
	"ranking" smallint,
	"incorporated" boolean,
	"military" boolean,
	"timezone" text,
	"source_simplemaps" boolean DEFAULT false NOT NULL,
	"zip_type" "zip_type",
	"is_active" boolean DEFAULT true NOT NULL,
	"area_codes" jsonb,
	"primary_city" text,
	"acceptable_cities" jsonb,
	"unacceptable_cities" jsonb,
	"source_seanpianka" boolean DEFAULT false NOT NULL,
	"zcta" char(5),
	"zcta_lat" numeric(10, 6),
	"zcta_lng" numeric(10, 6),
	"source_census" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"image" text,
	"password" text,
	"role" text DEFAULT 'customer' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_to_category" ADD CONSTRAINT "article_to_category_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_to_category" ADD CONSTRAINT "article_to_category_category_id_blog_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."blog_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_category_path" ADD CONSTRAINT "blog_category_path_category_id_blog_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."blog_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_category_path" ADD CONSTRAINT "blog_category_path_path_id_blog_categories_id_fk" FOREIGN KEY ("path_id") REFERENCES "public"."blog_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_path" ADD CONSTRAINT "category_path_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_path" ADD CONSTRAINT "category_path_path_id_categories_id_fk" FOREIGN KEY ("path_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_documents" ADD CONSTRAINT "company_documents_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_documents" ADD CONSTRAINT "company_documents_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_images" ADD CONSTRAINT "company_images_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_to_category" ADD CONSTRAINT "company_to_category_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_to_category" ADD CONSTRAINT "company_to_category_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_geo_usa_zip" ON "geo_usa" USING btree ("zip");--> statement-breakpoint
CREATE INDEX "idx_geo_usa_zip" ON "geo_usa" USING btree ("zip");--> statement-breakpoint
CREATE INDEX "idx_geo_usa_zcta" ON "geo_usa" USING btree ("zcta");--> statement-breakpoint
CREATE INDEX "idx_geo_usa_state" ON "geo_usa" USING btree ("state_id");--> statement-breakpoint
CREATE INDEX "idx_geo_usa_city" ON "geo_usa" USING btree ("city");--> statement-breakpoint
CREATE INDEX "idx_geo_usa_slug" ON "geo_usa" USING btree ("slug");