BEGIN
  EXECUTE IMMEDIATE 'CREATE TABLE SYBA.kennzahlvalue (
  boid VARCHAR (40),
  itsBatchRun VARCHAR (40),
  itsKennzahlConfig VARCHAR (40),
  itsBatchConfig VARCHAR (40),
  itsSyriusBatch VARCHAR (40),
  numberValue NUMBER (10, 2),
  timestampValue TIMESTAMP,
  started TIMESTAMP,
  CONSTRAINT kz_boid unique(boid)
  )';

  EXECUTE IMMEDIATE 'CREATE INDEX kz_batchconfig
  ON SYBA.kennzahlvalue (itsBatchConfig)';
  EXECUTE IMMEDIATE 'CREATE INDEX kz_batchrun
  ON SYBA.kennzahlvalue (itsBatchRun)';
  EXECUTE IMMEDIATE 'CREATE INDEX kz_kennzahlconfig
  ON SYBA.kennzahlvalue (itsKennzahlConfig)';
END;
