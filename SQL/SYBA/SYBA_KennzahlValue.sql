CREATE TABLE SYBA.kennzahlvalue (
  boid varchar(40),
  itsBatchRun varchar(40),
  itsKennzahlConfig varchar(40),
  itsBatchConfig varchar(40),
  itsBatch varchar(40),
  numberValue number(10,2),
  timestampValue timestamp
);

CREATE INDEX kz_batchconfig on SYBA.kennzahlvalue(itsBatchConfig);
CREATE INDEX kz_batchrun on SYBA.kennzahlvalue(itsBatchRun);
CREATE INDEX kz_kennzahlconfig on SYBA.kennzahlvalue(itsKennzahlConfig);
