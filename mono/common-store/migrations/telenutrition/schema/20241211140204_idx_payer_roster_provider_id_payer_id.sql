-- migrate:up transaction:false

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payer_roster_provider_id_payer_id ON telenutrition.payer_roster (provider_id, payer_id);

-- migrate:down
