-- Normalize all pre-existing accounts to the shared initial password and force
-- the account setup flow on their next login. Usernames are intentionally kept;
-- users choose their own username in the forced setup form.
UPDATE "User"
SET
  "passwordHash" = '$2b$12$mOFuCjV3II3DMWSul/vIe.DkgSG7NbKy0Tm89pYvppXP79YOSHPmu',
  "mustChangePassword" = true,
  "updatedAt" = CURRENT_TIMESTAMP;
