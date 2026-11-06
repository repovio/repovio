-- CreateTable
CREATE TABLE "user_groups" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "user_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_group_members" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "groupId" UUID NOT NULL,

    CONSTRAINT "user_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repository_group_grants" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "repositoryId" UUID NOT NULL,
    "role" "RepositoryRole" NOT NULL DEFAULT 'VIEWER',

    CONSTRAINT "repository_group_grants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_groups_name_key" ON "user_groups"("name");

-- CreateIndex
CREATE INDEX "user_group_members_userId_idx" ON "user_group_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_group_members_groupId_userId_key" ON "user_group_members"("groupId", "userId");

-- CreateIndex
CREATE INDEX "repository_group_grants_groupId_idx" ON "repository_group_grants"("groupId");

-- CreateIndex
CREATE UNIQUE INDEX "repository_group_grants_repositoryId_groupId_key" ON "repository_group_grants"("repositoryId", "groupId");

-- AddForeignKey
ALTER TABLE "user_group_members" ADD CONSTRAINT "user_group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_group_members" ADD CONSTRAINT "user_group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "user_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository_group_grants" ADD CONSTRAINT "repository_group_grants_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "user_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repository_group_grants" ADD CONSTRAINT "repository_group_grants_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
