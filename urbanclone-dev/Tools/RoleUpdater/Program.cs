using System.Data;
using Microsoft.Data.Sqlite;

if (args.Length < 2)
{
    Console.WriteLine("Usage: RoleUpdater <dbPath> <phone>");
    return;
}

var dbPath = args[0];
var phone = args[1];

if (!File.Exists(dbPath))
{
    Console.WriteLine($"DB not found: {dbPath}");
    return;
}

var cs = new SqliteConnectionStringBuilder { DataSource = dbPath }.ToString();
using var conn = new SqliteConnection(cs);
conn.Open();

using var cmd = conn.CreateCommand();
cmd.CommandText = "UPDATE Users SET Role = 'Admin' WHERE Phone = @phone;";
cmd.Parameters.AddWithValue("@phone", phone);

var rows = cmd.ExecuteNonQuery();
Console.WriteLine($"Rows updated: {rows}");
