resource "aws_security_group" "rds_public_access" {
  name = "${var.name_prefix}-rds-public-access-${var.environment}"
  description = "Allow public access for Lambda without VPC"

  ingress {
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

}

resource "aws_db_instance" "this" {
  identifier = "${var.name_prefix}-rds-${var.environment}"
  engine = var.engine
  engine_version = var.engine_version
  instance_class = var.instance_class
  allocated_storage = var.allocated_storage
  username = var.master_username
  password = var.master_password
  db_name = var.db_name
  skip_final_snapshot = var.skip_final_snapshot
  publicly_accessible = var.publicly_accessible
  vpc_security_group_ids = [aws_security_group.rds_public_access.id]
  deletion_protection = var.deletion_protection

  backup_retention_period = var.backup_retention_days

  apply_immediately = true
  multi_az = false
  storage_encrypted = false

}

