-- Client-only: indicates what kind of service they want
CREATE TYPE "RentalIntent" AS ENUM ('SHORT_TERM_FULL', 'ONE_TIME_ONLY', 'UNDECIDED');

ALTER TABLE "User" ADD COLUMN "rentalIntent" "RentalIntent";
