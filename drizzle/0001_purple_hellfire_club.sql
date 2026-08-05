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
ALTER TABLE "article_to_category" ADD CONSTRAINT "article_to_category_article_id_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_to_category" ADD CONSTRAINT "article_to_category_category_id_blog_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."blog_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_category_path" ADD CONSTRAINT "blog_category_path_category_id_blog_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."blog_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_category_path" ADD CONSTRAINT "blog_category_path_path_id_blog_categories_id_fk" FOREIGN KEY ("path_id") REFERENCES "public"."blog_categories"("id") ON DELETE cascade ON UPDATE no action;