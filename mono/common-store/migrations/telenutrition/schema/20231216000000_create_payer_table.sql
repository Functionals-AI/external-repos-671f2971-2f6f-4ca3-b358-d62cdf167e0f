-- migrate:up

CREATE TABLE telenutrition.payer (
    payer_id SERIAL PRIMARY KEY,
    label TEXT NOT NULL,
    roster_check BOOLEAN NOT NULL DEFAULT false,
    candid_payer_id TEXT NOT NULL,
    candid_payer_name TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_unique_candid_payer
ON telenutrition.payer (candid_payer_id, candid_payer_name);

ALTER TABLE telenutrition.schedule_insurance
    ADD COLUMN payer_id INT REFERENCES telenutrition.payer(payer_id);

INSERT INTO telenutrition.payer (payer_id, label, candid_payer_id, candid_payer_name)
VALUES
    (1, 'Texas Blue Shield', '84980', 'TEXAS BLUE SHIELD'),
    (2, 'Cigna', '62308', 'CIGNA'),
    (3, 'Capital District Physicians’ Health Plan (CDPHP)', '95491', 'CAPITAL DISTRICT PHYSICIANS HEALTH PLAN (CDPHP)'),
    (4, 'Dean Health Plan', '39113', 'DEAN HEALTH PLAN'),
    (5, 'Healthfirst of New York', '80141', 'HEALTHFIRST OF NEW YORK'),
    (6, 'Independent Health', '95308', 'NEW YORK INDEPENDENT HEALTH ASSOC (IHA) - WESTERN'),
    (7, 'Martins Point Health Care USFHP/Generations Adv', 'MPHC2', 'MARTINS POINT HEALTH CARE USFHP/GENERATIONS ADV'),
    (8, 'Molina Healthcare of Texas', '20554', 'MOLINA HEALTHCARE OF TEXAS'),
    (9, 'PacificSource Health Plans', '93029', 'PACIFICSOURCE HEALTH PLANS'),
    (10, 'Umpqua Health Alliance', '77505', 'UMPQUA HEALTH ALLIANCE'),
    (11, 'Aetna', '60054', 'AETNA'),
    (12, 'United Healthcare', '87726', 'UNITED HEALTHCARE'),
    (13, 'United Medical Resources', '39026', 'UNITED MEDICAL RESOURCES'),
    (14, 'Quartz ASO', '39180', 'QUARTZ ASO'),
    (15, 'CountyCare Health Plan', '06541', 'COUNTYCARE HEALTH PLAN'),
    (16, 'Health Services for Children with Special Needs', '37290', 'HEALTH SERVICES FOR CHILDREN WITH SPECIAL NEEDS'),
    (17, 'Banner University Family Care', '66901', 'BANNER UNIVERSITY FAMILY CARE (UNIVER OF AZ HLTH)');


-- migrate:down

