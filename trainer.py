import pandas as pd


df = pd.read_csv("./laptop.csv")
df = df.drop(columns=["Unnamed: 0"])

df["Price"] = (
    df["Price"]
    .str.replace("₹", "", regex=False)
    .str.replace(",", "", regex=False)
    .astype(int)
)
df["Price"].describe()

print(df.head())
print(df.info())
