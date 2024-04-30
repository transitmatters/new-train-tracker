# Look up the physical ID of the EC2 instance currently associated with the stack
INSTANCE_PHYSICAL_ID=$(aws cloudformation list-stack-resources --stack-name ntt --query "StackResourceSummaries[?LogicalResourceId=='NTTInstance'].PhysicalResourceId" --output text)

# Run the playbook! :-)
echo "Deploying the New Train Tracker to $INSTANCE_PHYSICAL_ID via Ansible..."
export ANSIBLE_HOST_KEY_CHECKING=False # If it's a new host, ssh known_hosts not having the key fingerprint will cause an error. Silence it
SSH_PROXY_ARGS="-o ProxyCommand='aws ec2-instance-connect open-tunnel --instance-id $INSTANCE_PHYSICAL_ID'"

