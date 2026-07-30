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
	"ssn" text,
	"itin" text,
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
CREATE TABLE "company_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"image" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company_to_category" ALTER COLUMN "company_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_images" ADD CONSTRAINT "company_images_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_to_category" ADD CONSTRAINT "company_to_category_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;