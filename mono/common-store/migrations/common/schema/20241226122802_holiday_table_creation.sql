-- migrate:up 

CREATE TABLE IF NOT EXISTS common.company_holiday (
  holiday_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  calendar_date DATE NOT NULL,
  reason TEXT NOT NULL,
  CONSTRAINT unique_calendar_date UNIQUE (calendar_date)
);

-- migrate:down