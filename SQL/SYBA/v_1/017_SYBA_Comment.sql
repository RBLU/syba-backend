BEGIN
  EXECUTE IMMEDIATE 'CREATE Table SYBA.COMMENT (
  boid varchar(40),
  itsBatchrun varchar(40),
  itsBatchconfig varchar(40),
  itsKennzahlConfig varchar(40),
  itsUser varchar(100),
  created date,
  text varchar(4000),
  newStatus varchar(40)
  CONSTRAINT bc_boid unique(boid))';
END;