mkdir -p .bundle

cd .bundle
cp -a ../controllers/ controllers
cp -a ../definitions/ definitions
cp -a ../modules/ modules
cp -a ../plugins/ plugins
cp -a ../public/ public
cp -a ../schemas/ schemas
cp -a ../views/ views

total4 --bundle cms.bundle
cp cms.bundle ../cms.bundle

cd ..
rm -rf .bundle
echo "DONE"