CREATE TYPE "public"."zip_type" AS ENUM('STANDARD', 'PO BOX', 'UNIQUE', 'MILITARY');--> statement-breakpoint
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
CREATE UNIQUE INDEX "uq_geo_usa_zip" ON "geo_usa" USING btree ("zip");--> statement-breakpoint
CREATE INDEX "idx_geo_usa_zip" ON "geo_usa" USING btree ("zip");--> statement-breakpoint
CREATE INDEX "idx_geo_usa_zcta" ON "geo_usa" USING btree ("zcta");--> statement-breakpoint
CREATE INDEX "idx_geo_usa_state" ON "geo_usa" USING btree ("state_id");--> statement-breakpoint
CREATE INDEX "idx_geo_usa_city" ON "geo_usa" USING btree ("city");--> statement-breakpoint
CREATE INDEX "idx_geo_usa_slug" ON "geo_usa" USING btree ("slug");