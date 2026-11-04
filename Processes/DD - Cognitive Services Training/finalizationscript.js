
var errorMessage = Variable.GetValueAsString("ErrorMessage");
if (errorMessage)
{
	Process.Exit(200, errorMessage);
}