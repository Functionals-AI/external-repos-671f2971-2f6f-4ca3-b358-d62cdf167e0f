-- migrate:up

INSERT INTO
    common.state (state)
VALUES
    ('AA'),
    ('AE'),
    ('AP'),
    ('AS'),
    ('DC'),
    ('FM'),
    ('GU'),
    ('MH'),
    ('MP'),
    ('PW'),
    ('PR'),
    ('VI');

-- migrate:down
