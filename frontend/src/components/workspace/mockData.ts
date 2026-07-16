export interface MockWorkspaceData {
  edaResult: any;
  models: any[];
  savedModels: any[];
  files: any[];
  reports: any[];
  logs: any[];
}

export function getMockWorkspaceData(workspaceId: string): MockWorkspaceData {
  switch (workspaceId) {
    case "sales":
      return {
        edaResult: {
          overview: {
            dataset_name: "sales_analysis_q2.csv",
            rows: 12500,
            columns: 8,
            numeric_columns: ["sales_amount", "quantity_ordered", "discount_percentage", "profit"],
            categorical_columns: ["order_id", "product_category", "customer_region"],
            datetime_columns: ["order_date"],
            columns_summary: {
              order_id: { null_count: 0, fill_rate: 1.0, unique_count: 12500 },
              order_date: { null_count: 0, fill_rate: 1.0, unique_count: 90 },
              product_category: { null_count: 0, fill_rate: 1.0, unique_count: 3 },
              sales_amount: { null_count: 0, fill_rate: 1.0, unique_count: 4200, mean: 412.50, std: 310.20, min: 10.50, median: 280.00, max: 8400.00 },
              quantity_ordered: { null_count: 0, fill_rate: 1.0, unique_count: 15, mean: 4.2, std: 2.1, min: 1, median: 3, max: 25 },
              discount_percentage: { null_count: 0, fill_rate: 1.0, unique_count: 5, mean: 0.08, std: 0.06, min: 0.0, median: 0.05, max: 0.25 },
              customer_region: { null_count: 0, fill_rate: 1.0, unique_count: 4 },
              profit: { null_count: 0, fill_rate: 1.0, unique_count: 3800, mean: 68.40, std: 142.10, min: -480.00, median: 45.00, max: 1850.00 }
            }
          },
          data_quality: {
            quality_score: 96.8,
            duplicates: 0,
            outliers: {
              sales_amount: { outliers_count: 142 },
              profit: { outliers_count: 88 }
            }
          },
          eda_accuracy: {
            completeness: 99.2,
            validity: 98.0,
            consistency: 95.5,
            uniqueness: 100.0,
            integrity: 94.2
          },
          dataset_slices: {
            col_names: ["order_id", "order_date", "product_category", "sales_amount", "quantity_ordered", "discount_percentage", "customer_region", "profit"],
            head: {
              "100": [
                { "order_id": "ORD-001", "order_date": "2026-04-01", "product_category": "Technology", "sales_amount": 1200, "quantity_ordered": 3, "discount_percentage": 0.05, "customer_region": "North", "profit": 240 },
                { "order_id": "ORD-002", "order_date": "2026-04-02", "product_category": "Office Supplies", "sales_amount": 150, "quantity_ordered": 10, "discount_percentage": 0.10, "customer_region": "East", "profit": 45 },
                { "order_id": "ORD-003", "order_date": "2026-04-05", "product_category": "Furniture", "sales_amount": 850, "quantity_ordered": 2, "discount_percentage": 0.15, "customer_region": "West", "profit": -20 },
                { "order_id": "ORD-004", "order_date": "2026-04-08", "product_category": "Technology", "sales_amount": 3400, "quantity_ordered": 5, "discount_percentage": 0.00, "customer_region": "South", "profit": 850 },
                { "order_id": "ORD-005", "order_date": "2026-04-12", "product_category": "Office Supplies", "sales_amount": 80, "quantity_ordered": 4, "discount_percentage": 0.00, "customer_region": "North", "profit": 32 },
                { "order_id": "ORD-006", "order_date": "2026-04-15", "product_category": "Furniture", "sales_amount": 1200, "quantity_ordered": 1, "discount_percentage": 0.20, "customer_region": "East", "profit": -120 },
                { "order_id": "ORD-007", "order_date": "2026-04-19", "product_category": "Technology", "sales_amount": 950, "quantity_ordered": 2, "discount_percentage": 0.05, "customer_region": "West", "profit": 190 },
                { "order_id": "ORD-008", "order_date": "2026-04-22", "product_category": "Office Supplies", "sales_amount": 220, "quantity_ordered": 6, "discount_percentage": 0.05, "customer_region": "South", "profit": 66 },
                { "order_id": "ORD-009", "order_date": "2026-04-26", "product_category": "Furniture", "sales_amount": 1800, "quantity_ordered": 4, "discount_percentage": 0.10, "customer_region": "North", "profit": 180 },
                { "order_id": "ORD-010", "order_date": "2026-04-30", "product_category": "Technology", "sales_amount": 450, "quantity_ordered": 1, "discount_percentage": 0.00, "customer_region": "East", "profit": 135 }
              ]
            }
          },
          visualization: {
            correlations: {
              sales_amount: { sales_amount: 1.0, quantity_ordered: 0.65, discount_percentage: -0.15, profit: 0.82 },
              quantity_ordered: { sales_amount: 0.65, quantity_ordered: 1.0, discount_percentage: 0.02, profit: 0.54 },
              discount_percentage: { sales_amount: -0.15, quantity_ordered: 0.02, discount_percentage: 1.0, profit: -0.74 },
              profit: { sales_amount: 0.82, quantity_ordered: 0.54, discount_percentage: -0.74, profit: 1.0 }
            },
            boxplots: {
              sales_amount: { min: 10.5, q1: 150.0, median: 280.0, q3: 750.0, max: 2400.0 },
              profit: { min: -180.0, q1: 12.0, median: 45.0, q3: 160.0, max: 850.0 }
            }
          },
          insights: [
            "Order profit margins are strongly correlated with discount_percentage (r = -0.74). Caps on regional discounts could improve margin.",
            "Sales volume peaks in the 'Technology' category, contributing 42% of total Q2 profit.",
            "Missing order_date timestamps resolved using forward fill imputation."
          ]
        },
        models: [
          { name: "Gradient Boosting Regressor", score: "R² = 0.941", type: "Regression", dataset: "sales_analysis_q2.csv" },
          { name: "Random Forest Regressor", score: "R² = 0.924", type: "Regression", dataset: "sales_analysis_q2.csv" }
        ],
        savedModels: [
          {
            model_key: "gb-sales-q2",
            name: "Gradient Boosting Regressor",
            metrics: { accuracy: 0.941, f1: 0.935 },
            registered_at: "2026-07-16 10:42"
          }
        ],
        files: [
          { id: 101, file_name: "sales_analysis_q2.csv", file_type: "csv", file_size_kb: 420, row_count: 12500, col_count: 8, uploaded_at: "2026-07-16 10:15" }
        ],
        reports: [
          { file_name: "Sales_Analysis_Q2_Summary.pdf", file_type: "PDF", generated_at: "2026-07-16 10:48" }
        ],
        logs: [
          { timestamp: "10:15:22 AM", node: "Ingestion", message: "Parsed sales_analysis_q2.csv successfully. 12,500 records found.", type: "success" },
          { timestamp: "10:16:04 AM", node: "EDA", message: "Profiling numerical margins, regions, and dates.", type: "info" },
          { timestamp: "10:17:15 AM", node: "Cleaning", message: "Applied outlier cap on sales_amount column.", type: "success" },
          { timestamp: "10:42:30 AM", node: "ML Studio", message: "Trained Gradient Boosting Regressor (R² = 0.941). Model registered.", type: "success" }
        ]
      };

    case "churn":
      return {
        edaResult: {
          overview: {
            dataset_name: "customer_churn_dataset.csv",
            rows: 8420,
            columns: 9,
            numeric_columns: ["tenure_months", "monthly_charges", "total_charges", "support_calls", "churn_risk"],
            categorical_columns: ["customer_id", "contract_type", "payment_method", "churned"],
            datetime_columns: [],
            columns_summary: {
              customer_id: { null_count: 0, fill_rate: 1.0, unique_count: 8420 },
              tenure_months: { null_count: 0, fill_rate: 1.0, unique_count: 72, mean: 22.4, std: 18.1, min: 1, median: 15, max: 72 },
              monthly_charges: { null_count: 0, fill_rate: 1.0, unique_count: 1540, mean: 74.20, std: 24.50, min: 18.90, median: 79.90, max: 118.90 },
              total_charges: { null_count: 42, fill_rate: 0.995, unique_count: 7800, mean: 1845.50, std: 1650.20, min: 18.90, median: 1250.00, max: 8400.00 },
              contract_type: { null_count: 0, fill_rate: 1.0, unique_count: 3 },
              payment_method: { null_count: 0, fill_rate: 1.0, unique_count: 4 },
              support_calls: { null_count: 0, fill_rate: 1.0, unique_count: 10, mean: 2.4, std: 1.6, min: 0, median: 2, max: 9 },
              churn_risk: { null_count: 0, fill_rate: 1.0, unique_count: 100, mean: 0.38, std: 0.28, min: 0.01, median: 0.31, max: 0.99 },
              churned: { null_count: 0, fill_rate: 1.0, unique_count: 2 }
            }
          },
          data_quality: {
            quality_score: 94.2,
            duplicates: 12,
            outliers: {
              support_calls: { outliers_count: 34 }
            }
          },
          eda_accuracy: {
            completeness: 97.8,
            validity: 96.0,
            consistency: 92.4,
            uniqueness: 99.8,
            integrity: 93.0
          },
          dataset_slices: {
            col_names: ["customer_id", "tenure_months", "monthly_charges", "total_charges", "contract_type", "payment_method", "support_calls", "churn_risk", "churned"],
            head: {
              "100": [
                { "customer_id": "CUST-9821", "tenure_months": 12, "monthly_charges": 64.80, "total_charges": 777.60, "contract_type": "Month-to-month", "payment_method": "Credit Card", "support_calls": 2, "churn_risk": 0.35, "churned": "No" },
                { "customer_id": "CUST-4530", "tenure_months": 2, "monthly_charges": 89.90, "total_charges": 179.80, "contract_type": "Month-to-month", "payment_method": "Electronic Check", "support_calls": 5, "churn_risk": 0.88, "churned": "Yes" },
                { "customer_id": "CUST-1129", "tenure_months": 36, "monthly_charges": 110.20, "total_charges": 3967.20, "contract_type": "One year", "payment_method": "Mailed Check", "support_calls": 1, "churn_risk": 0.12, "churned": "No" },
                { "customer_id": "CUST-0092", "tenure_months": 48, "monthly_charges": 45.30, "total_charges": 2174.40, "contract_type": "Two year", "payment_method": "Bank Transfer", "support_calls": 0, "churn_risk": 0.04, "churned": "No" },
                { "customer_id": "CUST-5542", "tenure_months": 8, "monthly_charges": 95.00, "total_charges": 760.00, "contract_type": "Month-to-month", "payment_method": "Electronic Check", "support_calls": 4, "churn_risk": 0.72, "churned": "Yes" },
                { "customer_id": "CUST-8831", "tenure_months": 24, "monthly_charges": 75.40, "total_charges": 1809.60, "contract_type": "One year", "payment_method": "Credit Card", "support_calls": 2, "churn_risk": 0.22, "churned": "No" },
                { "customer_id": "CUST-2234", "tenure_months": 1, "monthly_charges": 102.50, "total_charges": 102.50, "contract_type": "Month-to-month", "payment_method": "Electronic Check", "support_calls": 6, "churn_risk": 0.94, "churned": "Yes" },
                { "customer_id": "CUST-9012", "tenure_months": 60, "monthly_charges": 115.80, "total_charges": 6948.00, "contract_type": "Two year", "payment_method": "Credit Card", "support_calls": 1, "churn_risk": 0.02, "churned": "No" },
                { "customer_id": "CUST-6745", "tenure_months": 15, "monthly_charges": 85.20, "total_charges": 1278.00, "contract_type": "Month-to-month", "payment_method": "Mailed Check", "support_calls": 3, "churn_risk": 0.48, "churned": "No" },
                { "customer_id": "CUST-3312", "tenure_months": 4, "monthly_charges": 59.90, "total_charges": 239.60, "contract_type": "Month-to-month", "payment_method": "Bank Transfer", "support_calls": 3, "churn_risk": 0.61, "churned": "Yes" }
              ]
            }
          },
          visualization: {
            correlations: {
              tenure_months: { tenure_months: 1.0, monthly_charges: 0.25, total_charges: 0.85, support_calls: -0.22, churn_risk: -0.71 },
              monthly_charges: { tenure_months: 0.25, monthly_charges: 1.0, total_charges: 0.42, support_calls: 0.35, churn_risk: 0.64 },
              total_charges: { tenure_months: 0.85, monthly_charges: 0.42, total_charges: 1.0, support_calls: -0.12, churn_risk: -0.58 },
              support_calls: { tenure_months: -0.22, monthly_charges: 0.35, total_charges: -0.12, support_calls: 1.0, churn_risk: 0.79 },
              churn_risk: { tenure_months: -0.71, monthly_charges: 0.64, total_charges: -0.58, support_calls: 0.79, churn_risk: 1.0 }
            },
            boxplots: {
              monthly_charges: { min: 18.9, q1: 45.0, median: 79.9, q3: 98.2, max: 118.9 },
              support_calls: { min: 0, q1: 1.0, median: 2.0, q3: 4.0, max: 8.0 }
            }
          },
          insights: [
            "Customers with contract_type='Month-to-month' exhibit a 4.2x higher churn rate than those with annual contracts.",
            "Support calls > 3 is a primary feature indicator for customer churned outcomes.",
            "One-hot encoding applied to contract_type and payment_method for optimal logistic classifier fit."
          ]
        },
        models: [
          { name: "XGBoost Classifier", score: "Accuracy = 94.8%", type: "Classification", dataset: "customer_churn_dataset.csv" },
          { name: "Random Forest Classifier", score: "Accuracy = 93.2%", type: "Classification", dataset: "customer_churn_dataset.csv" }
        ],
        savedModels: [
          {
            model_key: "xgb-churn-risks",
            name: "XGBoost Classifier",
            metrics: { accuracy: 0.948, f1: 0.932 },
            registered_at: "2026-07-16 11:10"
          }
        ],
        files: [
          { id: 102, file_name: "customer_churn_dataset.csv", file_type: "csv", file_size_kb: 310, row_count: 8420, col_count: 9, uploaded_at: "2026-07-16 10:50" }
        ],
        reports: [
          { file_name: "Churn_Prediction_Inferences_Dashboard.pdf", file_type: "PDF", generated_at: "2026-07-16 11:22" }
        ],
        logs: [
          { timestamp: "10:50:11 AM", node: "Ingestion", message: "Parsed customer_churn_dataset.csv. 8,420 rows indexed.", type: "success" },
          { timestamp: "10:52:14 AM", node: "EDA", message: "Missing cells detected in total_charges (0.5%).", type: "warning" },
          { timestamp: "10:53:01 AM", node: "Cleaning", message: "Filled missing total_charges using median strategy.", type: "success" },
          { timestamp: "11:10:45 AM", node: "ML Studio", message: "XGBoost model compiled with 94.8% accuracy. Registered to workspace registry.", type: "success" }
        ]
      };

    case "marketing":
      return {
        edaResult: {
          overview: {
            dataset_name: "marketing_campaign_roi.csv",
            rows: 3100,
            columns: 8,
            numeric_columns: ["ad_spend", "clicks", "conversions", "customer_acquisition_cost", "revenue_generated", "roi"],
            categorical_columns: ["campaign_id", "channel"],
            datetime_columns: [],
            columns_summary: {
              campaign_id: { null_count: 0, fill_rate: 1.0, unique_count: 3100 },
              channel: { null_count: 0, fill_rate: 1.0, unique_count: 5 },
              ad_spend: { null_count: 0, fill_rate: 1.0, unique_count: 420, mean: 8200.00, std: 5400.00, min: 500.00, median: 6500.00, max: 45000.00 },
              clicks: { null_count: 0, fill_rate: 1.0, unique_count: 1800, mean: 28400, std: 19500, min: 1200, median: 22000, max: 150000 },
              conversions: { null_count: 0, fill_rate: 1.0, unique_count: 850, mean: 1140, std: 850, min: 25, median: 950, max: 6800 },
              customer_acquisition_cost: { null_count: 0, fill_rate: 1.0, unique_count: 1400, mean: 5.80, std: 3.10, min: 1.20, median: 4.80, max: 24.50 },
              revenue_generated: { null_count: 0, fill_rate: 1.0, unique_count: 2200, mean: 24500.00, std: 18200.00, min: 1200.00, median: 19800.00, max: 185000.00 },
              roi: { null_count: 0, fill_rate: 1.0, unique_count: 520, mean: 2.85, std: 1.45, min: 0.12, median: 2.45, max: 9.80 }
            }
          },
          data_quality: {
            quality_score: 98.1,
            duplicates: 0,
            outliers: {
              ad_spend: { outliers_count: 12 },
              customer_acquisition_cost: { outliers_count: 19 }
            }
          },
          eda_accuracy: {
            completeness: 100.0,
            validity: 98.8,
            consistency: 97.2,
            uniqueness: 100.0,
            integrity: 96.5
          },
          dataset_slices: {
            col_names: ["campaign_id", "channel", "ad_spend", "clicks", "conversions", "customer_acquisition_cost", "revenue_generated", "roi"],
            head: {
              "100": [
                { "campaign_id": "CMP-001", "channel": "Social Media", "ad_spend": 5000, "clicks": 25000, "conversions": 1250, "customer_acquisition_cost": 4.00, "revenue_generated": 22000, "roi": 3.40 },
                { "campaign_id": "CMP-002", "channel": "Search Ads", "ad_spend": 12000, "clicks": 48000, "conversions": 1800, "customer_acquisition_cost": 6.67, "revenue_generated": 38000, "roi": 2.17 },
                { "campaign_id": "CMP-003", "channel": "Email marketing", "ad_spend": 1500, "clicks": 18000, "conversions": 950, "customer_acquisition_cost": 1.58, "revenue_generated": 12000, "roi": 7.00 },
                { "campaign_id": "CMP-004", "channel": "Affiliate", "ad_spend": 8000, "clicks": 32000, "conversions": 1100, "customer_acquisition_cost": 7.27, "revenue_generated": 24000, "roi": 2.00 },
                { "campaign_id": "CMP-005", "channel": "Social Media", "ad_spend": 7500, "clicks": 38000, "conversions": 1950, "customer_acquisition_cost": 3.85, "revenue_generated": 31000, "roi": 3.13 },
                { "campaign_id": "CMP-006", "channel": "Search Ads", "ad_spend": 15000, "clicks": 55000, "conversions": 2100, "customer_acquisition_cost": 7.14, "revenue_generated": 42000, "roi": 1.80 },
                { "campaign_id": "CMP-007", "channel": "Email marketing", "ad_spend": 2000, "clicks": 22000, "conversions": 1200, "customer_acquisition_cost": 1.67, "revenue_generated": 15500, "roi": 6.75 },
                { "campaign_id": "CMP-008", "channel": "Video Ads", "ad_spend": 25000, "clicks": 90000, "conversions": 3200, "customer_acquisition_cost": 7.81, "revenue_generated": 68000, "roi": 1.72 },
                { "campaign_id": "CMP-009", "channel": "Social Media", "ad_spend": 3000, "clicks": 15000, "conversions": 800, "customer_acquisition_cost": 3.75, "revenue_generated": 14000, "roi": 3.67 },
                { "campaign_id": "CMP-010", "channel": "Display Ads", "ad_spend": 6000, "clicks": 18000, "conversions": 450, "customer_acquisition_cost": 13.33, "revenue_generated": 8500, "roi": 0.42 }
              ]
            }
          },
          visualization: {
            correlations: {
              ad_spend: { ad_spend: 1.0, clicks: 0.92, conversions: 0.84, customer_acquisition_cost: 0.54, revenue_generated: 0.88, roi: -0.22 },
              clicks: { ad_spend: 0.92, clicks: 1.0, conversions: 0.90, customer_acquisition_cost: 0.42, revenue_generated: 0.86, roi: -0.15 },
              conversions: { ad_spend: 0.84, clicks: 0.90, conversions: 1.0, customer_acquisition_cost: 0.18, revenue_generated: 0.95, roi: 0.38 },
              customer_acquisition_cost: { ad_spend: 0.54, clicks: 0.42, conversions: 0.18, customer_acquisition_cost: 1.0, revenue_generated: 0.22, roi: -0.68 },
              revenue_generated: { ad_spend: 0.88, clicks: 0.86, conversions: 0.95, customer_acquisition_cost: 0.22, revenue_generated: 1.0, roi: 0.52 },
              roi: { ad_spend: -0.22, clicks: -0.15, conversions: 0.38, customer_acquisition_cost: -0.68, revenue_generated: 0.52, roi: 1.0 }
            },
            boxplots: {
              ad_spend: { min: 500, q1: 3000, median: 6500, q3: 11000, max: 25000 },
              customer_acquisition_cost: { min: 1.20, q1: 2.80, median: 4.80, q3: 7.20, max: 15.0 }
            }
          },
          insights: [
            "Social Media campaigns yield the highest conversions per ad_spend, with an average ROI of 340%.",
            "Search ads present high acquisition costs (CAC) but deliver consistent high-value enterprise users.",
            "Standardized ad_spend and customer_acquisition_cost columns using z-score scaler."
          ]
        },
        models: [
          { name: "Ridge Regression", score: "R² = 0.884", type: "Regression", dataset: "marketing_campaign_roi.csv" },
          { name: "Linear Regression", score: "R² = 0.872", type: "Regression", dataset: "marketing_campaign_roi.csv" }
        ],
        savedModels: [
          {
            model_key: "ridge-roi-estimator",
            name: "Ridge Regression",
            metrics: { accuracy: 0.884, f1: 0.865 },
            registered_at: "2026-07-16 11:20"
          }
        ],
        files: [
          { id: 103, file_name: "marketing_campaign_roi.csv", file_type: "csv", file_size_kb: 148, row_count: 3100, col_count: 8, uploaded_at: "2026-07-16 11:05" }
        ],
        reports: [
          { file_name: "Marketing_Campaign_ROI_Report.pdf", file_type: "PDF", generated_at: "2026-07-16 11:30" }
        ],
        logs: [
          { timestamp: "11:05:32 AM", node: "Ingestion", message: "Parsed marketing_campaign_roi.csv successfully. 3,100 campaign logs mapped.", type: "success" },
          { timestamp: "11:06:50 AM", node: "EDA", message: "Verified data channels distribution profiles.", type: "info" },
          { timestamp: "11:07:44 AM", node: "Cleaning", message: "Standardized numerical variables using StandardScaler.", type: "success" },
          { timestamp: "11:20:15 AM", node: "ML Studio", message: "Ridge Regression (R² = 0.884) registered to model storage.", type: "success" }
        ]
      };

    case "revenue":
      return {
        edaResult: {
          overview: {
            dataset_name: "revenue_forecasting_data.csv",
            rows: 1800,
            columns: 7,
            numeric_columns: ["active_users", "subscription_mrr", "churn_mrr", "new_logo_mrr", "expansion_mrr", "total_revenue"],
            categorical_columns: [],
            datetime_columns: ["date"],
            columns_summary: {
              date: { null_count: 0, fill_rate: 1.0, unique_count: 1800 },
              active_users: { null_count: 0, fill_rate: 1.0, unique_count: 450, mean: 14800, std: 3200, min: 8500, median: 14200, max: 24500 },
              subscription_mrr: { null_count: 0, fill_rate: 1.0, unique_count: 1400, mean: 412000.00, std: 145000.00, min: 180000.00, median: 381200.00, max: 950000.00 },
              churn_mrr: { null_count: 0, fill_rate: 1.0, unique_count: 620, mean: 11200.00, std: 4200.00, min: 4500.00, median: 10500.00, max: 28000.00 },
              new_logo_mrr: { null_count: 0, fill_rate: 1.0, unique_count: 890, mean: 31200.00, std: 11500.00, min: 8000.00, median: 29000.00, max: 82000.00 },
              expansion_mrr: { null_count: 0, fill_rate: 1.0, unique_count: 750, mean: 19500.00, std: 6400.00, min: 5000.00, median: 18200.00, max: 48000.00 },
              total_revenue: { null_count: 0, fill_rate: 1.0, unique_count: 1500, mean: 453200.00, std: 154000.00, min: 201000.00, median: 425300.00, max: 1080000.00 }
            }
          },
          data_quality: {
            quality_score: 99.4,
            duplicates: 0,
            outliers: {
              expansion_mrr: { outliers_count: 4 }
            }
          },
          eda_accuracy: {
            completeness: 100.0,
            validity: 99.5,
            consistency: 99.0,
            uniqueness: 100.0,
            integrity: 98.8
          },
          dataset_slices: {
            col_names: ["date", "active_users", "subscription_mrr", "churn_mrr", "new_logo_mrr", "expansion_mrr", "total_revenue"],
            head: {
              "100": [
                { "date": "2026-01-01", "active_users": 12500, "subscription_mrr": 250000, "churn_mrr": 8500, "new_logo_mrr": 24000, "expansion_mrr": 12500, "total_revenue": 278000 },
                { "date": "2026-02-01", "active_users": 12900, "subscription_mrr": 278000, "churn_mrr": 9200, "new_logo_mrr": 28500, "expansion_mrr": 14800, "total_revenue": 312100 },
                { "date": "2026-03-01", "active_users": 13400, "subscription_mrr": 312100, "churn_mrr": 7400, "new_logo_mrr": 32000, "expansion_mrr": 16500, "total_revenue": 353200 },
                { "date": "2026-04-01", "active_users": 13800, "subscription_mrr": 353200, "churn_mrr": 11200, "new_logo_mrr": 21000, "expansion_mrr": 18200, "total_revenue": 381200 },
                { "date": "2026-05-01", "active_users": 14200, "subscription_mrr": 381200, "churn_mrr": 9800, "new_logo_mrr": 34500, "expansion_mrr": 19400, "total_revenue": 425300 },
                { "date": "2026-06-01", "active_users": 14750, "subscription_mrr": 425300, "churn_mrr": 10500, "new_logo_mrr": 38000, "expansion_mrr": 22400, "total_revenue": 475200 },
                { "date": "2026-07-01", "active_users": 15300, "subscription_mrr": 475200, "churn_mrr": 12100, "new_logo_mrr": 41200, "expansion_mrr": 24500, "total_revenue": 528800 },
                { "date": "2026-08-01", "active_users": 15800, "subscription_mrr": 528800, "churn_mrr": 14200, "new_logo_mrr": 29000, "expansion_mrr": 26100, "total_revenue": 569700 },
                { "date": "2026-09-01", "active_users": 16400, "subscription_mrr": 569700, "churn_mrr": 11500, "new_logo_mrr": 48500, "expansion_mrr": 28400, "total_revenue": 635100 },
                { "date": "2026-10-01", "active_users": 16900, "subscription_mrr": 635100, "churn_mrr": 13800, "new_logo_mrr": 33000, "expansion_mrr": 31200, "total_revenue": 685500 }
              ]
            }
          },
          visualization: {
            correlations: {
              active_users: { active_users: 1.0, subscription_mrr: 0.92, churn_mrr: 0.45, new_logo_mrr: 0.65, expansion_mrr: 0.72, total_revenue: 0.94 },
              subscription_mrr: { active_users: 0.92, subscription_mrr: 1.0, churn_mrr: 0.38, new_logo_mrr: 0.71, expansion_mrr: 0.81, total_revenue: 0.99 },
              churn_mrr: { active_users: 0.45, subscription_mrr: 0.38, churn_mrr: 1.0, new_logo_mrr: 0.12, expansion_mrr: 0.24, total_revenue: 0.35 },
              new_logo_mrr: { active_users: 0.65, subscription_mrr: 0.71, churn_mrr: 0.12, new_logo_mrr: 1.0, expansion_mrr: 0.34, total_revenue: 0.74 },
              expansion_mrr: { active_users: 0.72, subscription_mrr: 0.81, churn_mrr: 0.24, new_logo_mrr: 0.34, expansion_mrr: 1.0, total_revenue: 0.83 },
              total_revenue: { active_users: 0.94, subscription_mrr: 0.99, churn_mrr: 0.35, new_logo_mrr: 0.74, expansion_mrr: 0.83, total_revenue: 1.0 }
            },
            boxplots: {
              subscription_mrr: { min: 180000, q1: 278000, median: 381200, q3: 528800, max: 800000 },
              total_revenue: { min: 201000, q1: 312100, median: 425300, q3: 569700, max: 900000 }
            }
          },
          insights: [
            "MRR expansions show steady month-over-month growth of 4.8%, compensating for seasonal dips in new logo acquisition.",
            "Linear correlation indicates active_users directly drives MRR fluctuations (r = 0.92).",
            "Outliers in expansion_mrr capped at the 99th percentile to prevent long-tail regression skew."
          ]
        },
        models: [
          { name: "LSTM Regressor", score: "R² = 0.965", type: "Time-Series", dataset: "revenue_forecasting_data.csv" },
          { name: "Prophet Regressor", score: "R² = 0.938", type: "Time-Series", dataset: "revenue_forecasting_data.csv" }
        ],
        savedModels: [
          {
            model_key: "lstm-revenue-predictor",
            name: "LSTM Regressor",
            metrics: { accuracy: 0.965, f1: 0.958 },
            registered_at: "2026-07-16 11:32"
          }
        ],
        files: [
          { id: 104, file_name: "revenue_forecasting_data.csv", file_type: "csv", file_size_kb: 88, row_count: 1800, col_count: 7, uploaded_at: "2026-07-16 11:15" }
        ],
        reports: [
          { file_name: "Revenue_Forecasting_Predictive_Outlook.pdf", file_type: "PDF", generated_at: "2026-07-16 11:42" }
        ],
        logs: [
          { timestamp: "11:15:42 AM", node: "Ingestion", message: "Parsed revenue_forecasting_data.csv successfully. 1,800 timestamps mapped.", type: "success" },
          { timestamp: "11:16:11 AM", node: "EDA", message: "Profiling time-series seasonality and trend components.", type: "info" },
          { timestamp: "11:17:02 AM", node: "Cleaning", message: "Capped outliers in expansion_mrr at 99th percentile.", type: "success" },
          { timestamp: "11:32:44 AM", node: "ML Studio", message: "LSTM neural network model fit. Registered to forecast engine.", type: "success" }
        ]
      };

    default:
      return {
        edaResult: null,
        models: [],
        savedModels: [],
        files: [],
        reports: [],
        logs: []
      };
  }
}
