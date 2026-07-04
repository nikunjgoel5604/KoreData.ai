# // Data Analyzer EDA Platform v1.0 - Advanced Data Analysis & Visualization Platform

## 🎯 Overview

DataViz Pro is a modern, full-featured data analysis platform that combines:
- **Exploratory Data Analysis (EDA)** - Comprehensive dataset insights
- **ETL & Data Cleaning** - Smart missing value handling and data quality
- **Interactive Visualization** - Charts, pivot tables, and dashboards
- **Predictive Modeling** - Train ML models and make predictions
- **NLP Analytics** - Ask natural language questions about your data
- **Report Generation** - Create professional data analysis reports

## ✨ Key Features

### 1. **Workspace Management** 🏢
- Create unlimited workspaces for different projects
- Organize analyses by name and description
- Switch between workspaces seamlessly
- Local storage of workspace metadata

### 2. **Data Import** 📥
- Multiple data sources:
  - Local files (CSV, XLSX, JSON)
  - Database connections (coming soon)
  - Cloud storage (AWS S3, Google Cloud)
  - Social media APIs (coming soon)
  - Audio/Video files with transcription (coming soon)
- Drag-and-drop file upload
- Automatic file type detection

### 3. **Exploratory Data Analysis** 📊
- **Overview Statistics:**
  - Total rows and columns
  - Numeric vs categorical columns
  - DateTime detection with format mapping
  - Unique value counts per column

- **Data Quality Reports:**
  - Missing value analysis
  - Duplicate row detection
  - Outlier identification (IQR method)
  - Data cleanliness score

- **Advanced Insights:**
  - Statistical summaries (mean, median, std, quartiles)
  - Skewness and kurtosis analysis
  - Correlation matrix
  - Cardinality assessment

### 4. **Data Cleaning & ETL** 🧹
- **Automatic Missing Value Handling:**
  - Numeric: Fill with mean
  - Categorical: Fill with mode
  - DateTime: Smart interpolation

- **Before/After Comparison:**
  - Track which columns were cleaned
  - View methods applied
  - See missing values reduced

- **Data Preview:**
  - View HEAD(5), HEAD(20), FULL dataset
  - Scrollable data browser
  - Format detection

### 5. **Pivot Tables & Aggregation** 📈
- Create custom pivot tables
- Drag-and-drop dimension selection
- Multiple aggregation methods (Sum, Avg, Count, Min, Max)
- Export pivot results

### 6. **Data Visualization** 📉
- **Chart Types:**
  - Bar Charts
  - Line Charts
  - Pie/Doughnut Charts
  - Scatter Plots
  - Histograms
  - Correlation heatmaps

- **Chart Builder:**
  - Select X and Y axes
  - Customize titles and labels
  - Real-time preview
  - Export charts

### 7. **Interactive Dashboard** 🎨
- **Drag-and-drop Interface:**
  - Add charts, metrics, text blocks
  - Resize and rearrange items
  - Real-time grid updates

- **Dashboard Items:**
  - Charts with interactive legends
  - KPI metrics with trends
  - Rich text descriptions
  - Images and annotations

- **Dashboard Management:**
  - Save dashboard layouts
  - Export as PNG/PDF
  - Share with team

### 8. **Ask Analytics (NLP)** 💬
- Natural language query interface
- Pre-built query templates
- AI-powered analysis
- Automatic chart suggestions
- Natural language response generation

**Example Queries:**
- "What is the average sales by region?"
- "Show me top 10 products by revenue"
- "Calculate correlation between X and Y"
- "Find trends over time"

### 9. **Predictive Modeling** 🤖
- **Model Types:**
  - Regression (predict continuous values)
  - Classification (predict categories)
  - Clustering (group data)
  - Time Series Forecasting

- **Algorithms:**
  - Linear Regression
  - Decision Trees
  - Random Forest
  - Support Vector Machines (SVM)
  - Neural Networks

- **Model Evaluation:**
  - Accuracy metrics
  - Precision, Recall, F1-Score
  - Feature importance
  - Cross-validation scores

- **Predictions:**
  - Make predictions on new data
  - Confidence intervals
  - Export trained models

### 10. **Report Generation** 📄
- Automated report creation
- Executive summary
- Key findings
- Data quality assessment
- Visualization snapshots
- Export to PDF

## 📋 Requirements

### Backend
```
fastapi>=0.95.0
pandas>=1.5.0
numpy>=1.23.0
scikit-learn>=1.2.0
matplotlib>=3.6.0
seaborn>=0.12.0
openpyxl>=3.10.0
python-multipart>=0.0.5
```

### Frontend
- Modern browser with ES6 support
- Chart.js 4.x
- GSAP 3.x for animations

## 🚀 Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/dataviz-pro.git
cd dataviz-pro
```

### 2. Create Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run Server
```bash
python main.py
```
Server runs on `http://localhost:8000`

### 5. Access Application
Open browser to `http://localhost:8000`

## 📁 Project Structure

```
dataviz-pro/
├── main.py                 # FastAPI application
├── eda_engine.py          # EDA logic
├── etl_engine.py          # ETL/cleaning logic
├── requirements.txt       # Dependencies
├── index.html             # Main HTML
├── static/
│   ├── css/
│   │   └── style.css      # Styling
│   └── js/
│       └── app.js         # Frontend logic
└── README.md
```

## 🎨 UI/UX Features

### Design System
- **Color Palette:** Dark theme with primary indigo accent
- **Typography:** Space Grotesk (headings), Poppins (body)
- **Spacing:** 4px grid system
- **Animations:** GSAP-powered smooth transitions

### Responsive Design
- Desktop-first approach
- Mobile-friendly sidebar
- Collapsible navigation
- Adaptive grid layouts

## 🔐 Security

- CORS enabled for API
- Input validation on all endpoints
- File upload restrictions
- Secure session management
- Data isolation per workspace

## 🧪 Testing

### Run Unit Tests
```bash
pytest tests/
```

### Test Coverage
```bash
pytest --cov=. tests/
```

## 📚 API Documentation

### Endpoints

#### Upload & Analyze
**POST** `/upload`
- Upload file for EDA
- Returns complete analysis

#### Custom Analysis
**POST** `/analyze`
- Request: `{query: "analysis_type"}`
- Returns: Analysis results

#### Predictions
**POST** `/predict`
- Request: Model config and data
- Returns: Predictions with scores

#### NLP Query
**POST** `/nlp-query`
- Request: `{query: "natural language"}`
- Returns: Analysis and visualization

#### Health Check
**GET** `/health`
- Returns: Server status

## 🎓 Usage Examples

### Example 1: Basic EDA
```python
1. Create workspace "Sales Analysis"
2. Upload sales.csv
3. View overview stats
4. Check data quality report
5. Generate insights
```

### Example 2: Data Cleaning
```python
1. Import raw dataset
2. Review missing values
3. Apply automatic cleaning
4. Compare before/after
5. Validate cleaned data
```

### Example 3: Visualization Dashboard
```python
1. Create dashboard
2. Add chart for sales by region
3. Add KPI metric for total revenue
4. Add text description
5. Save and share dashboard
```

### Example 4: Predictive Model
```python
1. Configure model (Regression)
2. Select target variable (Sales)
3. Choose algorithm (Random Forest)
4. Set train/test split (80/20)
5. Train model → View accuracy → Make predictions
```

## 🔧 Configuration

### Environment Variables
```
PORT=8000
DEBUG=False
MAX_FILE_SIZE=100MB
DATABASE_URL=sqlite:///dataviz.db
```

### Customize Appearance
Edit CSS variables in `index.html`:
```css
:root {
    --primary: #6366f1;
    --primary-dark: #4f46e5;
    --accent: #06b6d4;
    /* ... more variables */
}
```

## 📊 Data Format Support

### Input Formats
- ✅ CSV
- ✅ XLSX / XLS
- ✅ JSON
- ✅ Parquet
- 🔄 SQL (coming soon)
- 🔄 Database connections (coming soon)

### Output Formats
- 📊 Charts (PNG, SVG)
- 📄 Reports (PDF)
- 📋 Data (CSV, XLSX)
- 🤖 Models (pickle, h5)

## 🚀 Performance Tips

1. **Large Datasets:** Upload in chunks
2. **Memory:** Use data filtering before visualization
3. **Charts:** Limit to 50 bars/points for smooth rendering
4. **Predictions:** Train with representative sample first

## 🐛 Troubleshooting

### File Upload Issues
- Ensure file < 100MB
- Check file format is supported
- Verify file encoding (UTF-8 preferred)

### Slow Performance
- Clear browser cache
- Reduce dataset size
- Check system RAM

### Missing Data
- Check date formats match expected patterns
- Verify categorical values don't have hidden spaces
- Review missing value strategy

## 📞 Support

- **Documentation:** See full docs in `/docs`
- **Issues:** GitHub Issues
- **Email:** support@datavizpro.io

## 📝 License

MIT License - See LICENSE file

## 🎉 Future Roadmap

- [ ] Real-time collaboration
- [ ] Advanced ML models (XGBoost, Neural Networks)
- [ ] Integration with BI tools (Tableau, Power BI)
- [ ] Custom SQL queries
- [ ] Data versioning
- [ ] Advanced scheduling/automation
- [ ] Team management
- [ ] API keys and webhooks

## 👨‍💻 Contributing

Contributions welcome! Please:
1. Fork repository
2. Create feature branch
3. Submit pull request

## ⭐ Show Your Support

If you find DataViz Pro helpful, please star ⭐ this repository!

---

**Built with ❤️ using FastAPI, Pandas, and Chart.js**
