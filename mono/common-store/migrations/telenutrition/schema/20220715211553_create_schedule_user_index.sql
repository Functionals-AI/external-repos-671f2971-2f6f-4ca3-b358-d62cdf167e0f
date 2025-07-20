-- migrate:up
CREATE UNIQUE INDEX "schedule_user_fs_user_id_idx" ON "telenutrition"."schedule_user" USING BTREE ("fs_user_id");


-- migrate:down

