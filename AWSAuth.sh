#!/bin/bash
set -e

# specify your MFA_DEVICE_ARN
MFA_DEVICE_ARN="arn:aws:iam::101289275893:mfa/tim.frankland"
PATH_TO_CREDENTIALS_FILE="C:\Users\tim\.aws\credentials"
echo $PATH_TO_CREDENTIALS_FILE
#1H = 3600
#2H = 7200
#3H = 10800
#4H = 14400
#5H = 18000
#6H = 21600
#7H = 25200
TOKEN_DURATION_IN_SECONDS=21600

if [ MFA_DEVICE_ARN = YOUR_MFA_ARN ]; then
    echo "Please specify the MFA_DEVICE_ARN"
    exit 1
fi

if [ -z $TOKEN_DURATION_IN_SECONDS ]; then
    echo "Please specify the TOKEN_DURATION_IN_SECONDS"
    exit 1
fi

read -p "Please enter MFA code: " MFA_CODE

echo "You entered '$MFA_CODE'"

COMMAND="aws --output text sts get-session-token \
    --serial-number $MFA_DEVICE_ARN \
    --token-code $MFA_CODE \
    --duration $TOKEN_DURATION_IN_SECONDS"

echo $COMMAND
CREDS=$($COMMAND)

KEY=$(echo $CREDS | cut -d" " -f2)
SECRET=$(echo $CREDS | cut -d" " -f4)
SESS_TOKEN=$(echo $CREDS | cut -d" " -f5)

if grep -w "mfa" $PATH_TO_CREDENTIALS_FILE
then
    sed -i '/mfa/,$d' $PATH_TO_CREDENTIALS_FILE
fi

echo "[mfa]" >> $PATH_TO_CREDENTIALS_FILE
echo "aws_access_key_id = $KEY" >> $PATH_TO_CREDENTIALS_FILE
echo "aws_secret_access_key = $SECRET" >> $PATH_TO_CREDENTIALS_FILE
echo "aws_session_token = $SESS_TOKEN" >> $PATH_TO_CREDENTIALS_FILE