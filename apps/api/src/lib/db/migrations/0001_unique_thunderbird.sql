CREATE TABLE "snippets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"code" text NOT NULL,
	"language" varchar(50) NOT NULL,
	"user_id" uuid NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "snippets" ADD CONSTRAINT "snippets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "snippets_user_id_idx" ON "snippets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "snippets_language_idx" ON "snippets" USING btree ("language");--> statement-breakpoint
CREATE INDEX "snippets_created_at_idx" ON "snippets" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "snippets_public_created_at_idx" ON "snippets" USING btree ("is_public","created_at");