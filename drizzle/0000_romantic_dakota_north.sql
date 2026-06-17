CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" text PRIMARY KEY NOT NULL,
	"userid" text NOT NULL,
	"companyname" text NOT NULL,
	"contactperson" text,
	"title" text,
	"email" text,
	"phone" text,
	"address" text,
	"notes" text,
	"createdat" timestamp DEFAULT now() NOT NULL,
	"updatedat" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devis" (
	"id" text PRIMARY KEY NOT NULL,
	"userid" text NOT NULL,
	"number" text NOT NULL,
	"clientid" text NOT NULL,
	"date" text NOT NULL,
	"emaildate" text NOT NULL,
	"subject" text,
	"introduction" text,
	"premises" text,
	"amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"taxes" numeric(10, 2) DEFAULT '0' NOT NULL,
	"ttc" numeric(10, 2) DEFAULT '0' NOT NULL,
	"taxpercentage" integer DEFAULT 19 NOT NULL,
	"signaturename" text DEFAULT 'Direction Fayçal Jelloul' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"workitems" jsonb DEFAULT '[]' NOT NULL,
	"taxmode" text DEFAULT 'ttc' NOT NULL,
	"passagecount" integer DEFAULT 1 NOT NULL,
	"passagesameprice" boolean DEFAULT true NOT NULL,
	"passageunitprice" text DEFAULT '' NOT NULL,
	"passageprices" jsonb DEFAULT '[]' NOT NULL,
	"createdat" timestamp DEFAULT now() NOT NULL,
	"updatedat" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" text PRIMARY KEY NOT NULL,
	"userid" text NOT NULL,
	"companyname" text NOT NULL,
	"companyaddress" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"defaultsignature" text DEFAULT 'Direction Fayçal Jelloul' NOT NULL,
	"currency" text DEFAULT 'DT' NOT NULL,
	"taxlabel" text DEFAULT 'TVA' NOT NULL,
	"taxpercentage" integer DEFAULT 19 NOT NULL,
	"darkmode" boolean DEFAULT false NOT NULL,
	"logourl" text,
	"stampurl" text,
	"createdat" timestamp DEFAULT now() NOT NULL,
	"updatedat" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_userid_unique" UNIQUE("userid")
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" text PRIMARY KEY NOT NULL,
	"userid" text NOT NULL,
	"name" text NOT NULL,
	"introduction" text,
	"signature" text DEFAULT 'Direction Fayçal Jelloul' NOT NULL,
	"content" jsonb DEFAULT '{}' NOT NULL,
	"createdat" timestamp DEFAULT now() NOT NULL,
	"updatedat" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;