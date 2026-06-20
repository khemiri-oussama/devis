ALTER TABLE "devis" ALTER COLUMN "taxmode" SET DEFAULT 'ht';--> statement-breakpoint
ALTER TABLE "devis" ADD COLUMN "contracttype" text DEFAULT 'monthly' NOT NULL;--> statement-breakpoint
ALTER TABLE "devis" ADD COLUMN "monthlypassages" jsonb DEFAULT '[{"month":"Janvier","count":0},{"month":"Février","count":0},{"month":"Mars","count":0},{"month":"Avril","count":0},{"month":"Mai","count":0},{"month":"Juin","count":0},{"month":"Juillet","count":0},{"month":"Août","count":0},{"month":"Septembre","count":0},{"month":"Octobre","count":0},{"month":"Novembre","count":0},{"month":"Décembre","count":0}]' NOT NULL;--> statement-breakpoint
ALTER TABLE "devis" ADD COLUMN "oneoffpassagecount" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "devis" DROP COLUMN "passagecount";--> statement-breakpoint
ALTER TABLE "devis" DROP COLUMN "passagesameprice";--> statement-breakpoint
ALTER TABLE "devis" DROP COLUMN "passageprices";