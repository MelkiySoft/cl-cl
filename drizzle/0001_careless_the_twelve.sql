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
CREATE TABLE "company_to_category" (
	"company_id" text NOT NULL,
	"category_id" integer NOT NULL,
	"is_main" boolean DEFAULT false NOT NULL,
	CONSTRAINT "company_to_category_company_id_category_id_pk" PRIMARY KEY("company_id","category_id")
);
--> statement-breakpoint
ALTER TABLE "category_path" ADD CONSTRAINT "category_path_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_path" ADD CONSTRAINT "category_path_path_id_categories_id_fk" FOREIGN KEY ("path_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_to_category" ADD CONSTRAINT "company_to_category_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;