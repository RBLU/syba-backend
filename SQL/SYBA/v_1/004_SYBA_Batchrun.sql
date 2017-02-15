CREATE Table SYBA.BATCHRUN (
  boid varchar(40),
  itsBatchconfig varchar(40),
  itsSyriusBatch varchar(40),
  itsSyriusBatchlauf varchar(40),
  usercomment varchar(4000),
  ignoreInStats number(1),
  started timestamp,
  ended timestamp
)

